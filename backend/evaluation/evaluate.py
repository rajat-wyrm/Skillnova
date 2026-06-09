"""RAGAS Evaluation Pipeline for SkillNova Agentic RAG.

Metrics:
  - Faithfulness: Is the answer grounded in the retrieved context?
  - Answer Relevancy: Does the answer address the question asked?
  - Context Precision: Are the retrieved documents actually relevant?
  - Context Recall: Did we retrieve all the necessary information?

Dual Evaluation Strategy:
  - Dev mode: Uses Groq (Llama 3.1) for fast, free evaluation
  - Final mode: Uses OpenAI (GPT-4o-mini) for higher accuracy

Usage:
  python evaluation/evaluate_fixed.py                 # Dev mode (Groq)
  python evaluation/evaluate_fixed.py --final         # Final mode (OpenAI)
  python evaluation/evaluate_fixed.py --compare       # Before/After comparison
"""

import os
import sys
import json
import time
import argparse
from datetime import datetime

# Add parent dir to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + "/..")

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env"))

from llm import get_llm, rate_limiter
from retriever import load_and_index_documents
from agent.nodes import set_dependencies
from agent.graph import build_graph

# RAGAS imports
try:
    from ragas import evaluate
    from ragas.metrics import (
        faithfulness, answer_relevancy, context_precision, context_recall
    )
    RAGAS_AVAILABLE = True
except ImportError as e:
    print(f"[WARNING] RAGAS not available: {e}")
    print("[INFO] Install with: pip install ragas")
    RAGAS_AVAILABLE = False


def load_test_questions() -> list[dict]:
    """Load evaluation dataset."""
    test_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_questions.json")
    with open(test_file, "r", encoding="utf-8") as f:
        return json.load(f)


def run_pipeline_on_questions(questions: list[dict], use_agent: bool = True) -> list[dict]:
    """
    Run each test question through the pipeline and collect results.
    
    Args:
        questions: List of test question dicts
        use_agent: If True, use the full agentic RAG. If False, use basic RAG.
    
    Returns:
        List of result dicts with question, answer, contexts, ground_truth
    """
    from main import init_pipeline
    
    print("[INIT] Initializing pipeline...")
    init_pipeline()
    
    results = []
    total = len(questions)
    
    for i, q in enumerate(questions):
        print(f"\n[{i+1}/{total}] Testing: '{q['question'][:60]}'")
        start = time.time()
        
        try:
            if use_agent:
                # Full agentic RAG
                from agent.state import AgentState
                from agent.graph import agent_graph
                
                # Build initial state
                initial_state = {
                    "question": q["question"],
                    "language": "en",
                    "role": "Intern",
                    "chat_history": "",
                    "session_id": f"eval_{i}",
                    "documents": [],
                    "web_results": "",
                    "route": "",
                    "query_rewrite_count": 0,
                    "doc_relevance": "",
                    "tools_used": [],
                    "llm_calls_count": 0,
                    "generation": None,
                    "confidence": 0.0,
                    "is_escalated": False,
                }
                
                # Run agent graph
                result = agent_graph.invoke(initial_state)
                answer = result.get("generation", "No answer generated")
                contexts = result.get("documents", [])
                confidence = result.get("confidence", 0.0)
                tools_used = result.get("tools_used", [])
                
            else:
                # Basic RAG (for comparison)
                from llm import get_llm
                from retriever import load_and_index_documents
                
                llm = get_llm(provider="groq", temperature=0.3)
                kb_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "knowledge_base")
                vectorstore = load_and_index_documents(kb_dir)
                set_dependencies(vectorstore, llm, rate_limiter)
                
                # Simple retrieve + generate
                docs = vectorstore.similarity_search(q["question"], k=4)
                contexts = [d.page_content for d in docs]
                
                context_str = "\n\n".join(contexts)
                prompt = f"""Answer this question based on the context:

Context:
{context_str}

Question: {q["question"]}

Answer:"""
                
                answer = llm.invoke(prompt).content.strip()
                confidence = 0.7  # Default confidence for basic RAG
                tools_used = ["faiss"]
                contexts = docs
            
            # Calculate latency
            latency_ms = int((time.time() - start) * 1000)
            
            result_dict = {
                "question": q["question"],
                "answer": answer,
                "contexts": contexts,
                "ground_truth": q["ground_truth"],
                "expected_topic": q["expected_topic"],
                "difficulty": q["difficulty"],
                "confidence": confidence,
                "tools_used": tools_used,
                "latency_ms": latency_ms,
                "pipeline_type": "agentic" if use_agent else "basic"
            }
            
            results.append(result_dict)
            print(f"  ✓ Answer: {answer[:50]}...")
            print(f"  ✓ Confidence: {confidence}")
            print(f"  ✓ Tools: {tools_used}")
            print(f"  ✓ Latency: {latency_ms}ms")
            
        except Exception as e:
            print(f"  ✗ Error: {e}")
            result_dict = {
                "question": q["question"],
                "answer": f"ERROR: {str(e)}",
                "contexts": [],
                "ground_truth": q["ground_truth"],
                "expected_topic": q["expected_topic"],
                "difficulty": q["difficulty"],
                "confidence": 0.0,
                "tools_used": [],
                "latency_ms": 0,
                "pipeline_type": "agentic" if use_agent else "basic"
            }
            results.append(result_dict)
    
    return results


def evaluate_with_ragas(results: list[dict]) -> dict:
    """
    Evaluate results using RAGAS metrics.
    
    Args:
        results: List of pipeline results with questions, answers, contexts
    
    Returns:
        Dictionary with metric scores and analysis
    """
    if not RAGAS_AVAILABLE:
        print("[ERROR] RAGAS not available. Cannot evaluate.")
        return {"error": "RAGAS not available"}
    
    from datasets import Dataset
    from ragas.evaluation import evaluate
    
    # Convert to RAGAS format
    data_rows = []
    for r in results:
        if r["answer"].startswith("ERROR"):
            continue
            
        data_rows.append({
            "question": r["question"],
            "answer": r["answer"],
            "contexts": r["contexts"],
            "ground_truth": r["ground_truth"],
        })
    
    dataset = Dataset.from_dicts(data_rows)
    
    print("\n[EVALUATION] Running RAGAS evaluation...")
    
    # Define metrics
    metrics = [
        faithfulness,
        answer_relevancy,
        context_precision,
        context_recall,
    ]
    
    # Run evaluation
    evaluation_results = evaluate(
        dataset=dataset,
        metrics=metrics,
        llm_provider="groq" if args.openai_key is None else "openai",
        raise_exceptions=False
    )
    
    # Extract scores
    scores = {}
    for metric_name, metric_result in evaluation_results.items():
        scores[metric_name] = metric_result
    
    return {
        "scores": scores,
        "individual_results": evaluation_results,
        "evaluation_count": len(data_rows),
        "timestamp": datetime.now().isoformat()
    }


def print_comparison_report(basic_results: list[dict], agentic_results: dict):
    """Print a comparison report between basic and agentic RAG."""
    print("\n" + "="*60)
    print("COMPARISON REPORT: Basic RAG vs Agentic RAG")
    print("="*60)
    
    # Calculate average scores
    basic_scores = evaluate_with_ragas(basic_results)
    agentic_scores = agentic_results["scores"]
    
    print("\n📊 OVERALL SCORES:")
    print(f"{'Metric':<20} | {'Basic RAG':<15} | {'Agentic RAG':<15}")
    print("-" * 50)
    
    for metric in ["faithfulness", "answer_relevancy", "context_precision", "context_recall"]:
        basic_score = basic_scores["scores"].get(metric, {}).get("fmeasure", 0)
        agentic_score = agentic_scores.get(metric, {}).get("fmeasure", 0)
        improvement = agentic_score - basic_score
        print(f"{metric:<20} | {basic_score:.3f} | {agentic_score:.3f} | {improvement:+.3f}")
    
    print("\n🎯 TARGET METRICS (Goal: >0.80):")
    for metric, target in [
        ("faithfulness", 0.85),
        ("answer_relevancy", 0.88),
        ("context_precision", 0.80),
        ("context_recall", 0.82),
    ]:
        current = agentic_scores.get(metric, {}).get("fmeasure", 0)
        status = "✅ TARGET MET" if current >= target else "❌ BELOW TARGET"
        print(f"{metric:<20} | {current:.3f} | {target:.2f} | {status}")
    
    print(f"\n📈 IMPROVEMENT SUMMARY:")
    total_improvement = sum(
            agentic_scores.get(metric, {}).get("fmeasure", 0) - 
            basic_scores["scores"].get(metric, {}).get("fmeasure", 0)
            for metric in ["faithfulness", "answer_relevancy", "context_precision", "context_recall"]
        )
    avg_improvement = total_improvement / 4
    print(f"Average improvement: {avg_improvement:+.3f}")
    
    # Count escalations
    basic_escalations = sum(1 for r in basic_results if "escalate" in r.get("answer", "").lower())
    agentic_escalations = sum(1 for r in agentic_results["individual_results"] if "ESCALATE_TO_ADMIN" in str(r.get("answer", "")))
    print(f"\n🚨 ESCALATION RATE:")
    print(f"Basic RAG: {basic_escalations}/{len(basic_results)} ({basic_escalations/len(basic_results)*100:.1f}%)")
    print(f"Agentic RAG: {agentic_escalations}/{len(agentic_results['individual_results'])} ({agentic_escalations/len(agentic_results['individual_results'])*100:.1f}%)")


def main():
    """Main evaluation runner."""
    parser = argparse.ArgumentParser(description="Evaluate SkillNova Agentic RAG pipeline")
    parser.add_argument("--final", action="store_true", help="Use OpenAI for evaluation (higher accuracy)")
    parser.add_argument("--compare", action="store_true", help="Compare basic vs agentic RAG")
    parser.add_argument("--openai-key", help="OpenAI API key for final evaluation")
    args = parser.parse_args()
    
    # Load test questions
    questions = load_test_questions()
    print(f"[INFO] Loaded {len(questions)} test questions")
    
    if args.compare:
        print("\n[INFO] Running comparison: Basic RAG vs Agentic RAG")
        
        # Run both pipelines
        print("\n[INFO] Testing Basic RAG...")
        basic_results = run_pipeline_on_questions(questions, use_agent=False)
        
        print("\n[INFO] Testing Agentic RAG...")
        agentic_results = run_pipeline_on_questions(questions, use_agent=True)
        
        # Print comparison
        print_comparison_report(basic_results, agentic_results)
        
    else:
        # Single evaluation run
        use_openai = args.final
        provider = "openai" if use_openai else "groq"
        
        print(f"\n[INFO] Running evaluation with {provider}...")
        results = run_pipeline_on_questions(questions, use_agent=True)
        
        if RAGAS_AVAILABLE:
            evaluation = evaluate_with_ragas(results)
            
            # Save results
            results_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "results")
            os.makedirs(results_dir, exist_ok=True)
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"evaluation_{provider}_{timestamp}.json"
            
            with open(os.path.join(results_dir, filename), "w", encoding="utf-8") as f:
                json.dump(evaluation, f, indent=2)
            
            print(f"\n[SUCCESS] Evaluation complete! Results saved to: {filename}")
            print(f"\n📊 FINAL SCORES:")
            
            scores = evaluation["scores"]
            for metric, result in scores.items():
                score = result.get("fmeasure", 0)
                print(f"{metric:<20}: {score:.3f}")
            
            print(f"\n📁 Results saved to: evaluation/{filename}")
        else:
            print("\n[ERROR] RAGAS not available. Install with: pip install ragas")


if __name__ == "__main__":
    main()
