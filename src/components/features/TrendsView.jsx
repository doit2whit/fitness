import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { kgToLbs } from '../../utils/helpers';
import Card from '../ui/Card';
import Select from '../ui/Select';

const TrendsView = ({ workoutHistory, movements, settings }) => {
  const [selectedMovement, setSelectedMovement] = useState('');

  const chartData = useMemo(() => {
    if (!selectedMovement) return [];

    const data = [];

    workoutHistory.forEach(workout => {
      const exercise = workout.exercises.find(ex => ex.movementId === selectedMovement && ex.type !== 'interval');
      if (exercise && exercise.sets && exercise.sets.length > 0) {
        const exerciseUnit = exercise.unit || workout.unit || 'lbs';

        const weights = exercise.sets.map(s => {
          const setUnit = s.unit || exerciseUnit;
          return setUnit === 'kg' ? kgToLbs(s.weight) : s.weight;
        });

        const maxWeight = Math.max(...weights);

        const totalVolume = exercise.sets.reduce((sum, s) => {
          const setUnit = s.unit || exerciseUnit;
          const weightInLbs = setUnit === 'kg' ? kgToLbs(s.weight) : s.weight;
          return sum + (weightInLbs * s.reps);
        }, 0);

        data.push({
          date: new Date(workout.startTime).toLocaleDateString(),
          maxWeight,
          totalVolume,
          sets: exercise.sets.length,
          totalReps: exercise.sets.reduce((sum, s) => sum + s.reps, 0)
        });
      }
    });

    return data.reverse();
  }, [workoutHistory, selectedMovement]);

  const movementsWithHistory = useMemo(() => {
    const movementIds = new Set();
    workoutHistory.forEach(workout => {
      workout.exercises.forEach(ex => {
        // Only include sets-based exercises (interval exercises have no weight data to chart)
        if (ex.type !== 'interval' && ex.sets && ex.sets.length > 0) movementIds.add(ex.movementId);
      });
    });
    return movements.filter(m => movementIds.has(m.id));
  }, [workoutHistory, movements]);

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <Select
          label="Select Exercise"
          value={selectedMovement}
          onChange={(e) => setSelectedMovement(e.target.value)}
          options={[
            { value: '', label: 'Choose an exercise to view trends...' },
            ...movementsWithHistory.map(m => ({ value: m.id, label: m.name }))
          ]}
        />
      </Card>

      {selectedMovement && chartData.length > 0 ? (
        <>
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Max Weight Over Time</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="maxWeight"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    name="Max Weight (lbs)"
                    dot={{ fill: '#4f46e5' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Total Volume Over Time</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="totalVolume"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Total Volume (lbs × reps)"
                    dot={{ fill: '#10b981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Recent Sessions</h3>
            <div className="space-y-2">
              {chartData.slice(-5).reverse().map((session, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{session.date}</span>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>Max: {session.maxWeight} lbs</span>
                    <span>{session.sets} sets</span>
                    <span>{session.totalReps} total reps</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      ) : selectedMovement ? (
        <Card className="p-8">
          <div className="text-center text-gray-500">
            No workout data available for this exercise yet.
          </div>
        </Card>
      ) : (
        <Card className="p-8">
          <div className="text-center text-gray-500">
            Select an exercise to view your progress trends.
          </div>
        </Card>
      )}
    </div>
  );
};

export default TrendsView;
