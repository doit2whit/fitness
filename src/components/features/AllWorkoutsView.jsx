import React from 'react';
import Icons from '../icons/Icons';
import Card from '../ui/Card';
import WorkoutSummaryCard from './WorkoutSummaryCard';

const AllWorkoutsView = ({ workoutHistory, movements, onSelectWorkout, onBack }) => {
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Icons.Back /> Back
      </button>

      <h3 className="text-lg font-semibold text-gray-900">All Workouts</h3>

      {workoutHistory.length === 0 ? (
        <Card className="p-8">
          <div className="text-center text-gray-500">No workouts recorded yet</div>
        </Card>
      ) : (
        <div className="space-y-3">
          {workoutHistory.map(workout => (
            <WorkoutSummaryCard
              key={workout.id}
              workout={workout}
              movements={movements}
              onClick={() => onSelectWorkout(workout)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AllWorkoutsView;
