import { useEffect, useState } from 'react';
import { Card } from '../../shared/components/UI';
import api from '../../lib/api';
import { TrendingUp } from 'lucide-react';

const SkillsTracker = () => {
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const res = await api.get('/skills/my-skills');
      setSkills(res.data);
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Skills & Progress</h2>
      {skills.map((skill) => (
        <Card key={skill.id} className="p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="font-bold">{skill.skillName}</p>
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
              {skill.level}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${skill.progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-2">{skill.progress}% complete</p>
          {skill.acquiredDate && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp size={12} /> Acquired on {new Date(skill.acquiredDate).toLocaleDateString()}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
};

export default SkillsTracker;