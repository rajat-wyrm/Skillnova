import { useEffect, useState } from 'react';
import { Card } from '../../shared/components/UI';
import api from '../../lib/api';
import { Star } from 'lucide-react';

const PerformanceReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await api.get('/performance/reviews');
      setReviews(res.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Performance Reviews</h2>
      {reviews.map((review) => (
        <Card key={review.id} className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="font-bold">{review.month}/{review.year}</p>
              <p className="text-sm text-gray-600">By: {review.mentorName}</p>
            </div>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                />
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-600">Technical</p>
              <p className="text-lg font-bold">{review.technical}/5</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Communication</p>
              <p className="text-lg font-bold">{review.communication}/5</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Teamwork</p>
              <p className="text-lg font-bold">{review.teamwork}/5</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Attendance</p>
              <p className="text-lg font-bold">{review.attendance}/5</p>
            </div>
          </div>

          {review.feedback && (
            <div>
              <p className="text-sm font-semibold mb-2">Feedback</p>
              <p className="text-sm text-gray-700">{review.feedback}</p>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default PerformanceReviews;