import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { kgToLbs, formatTime } from '../../utils/helpers';
import Card from '../ui/Card';
import Select from '../ui/Select';

const TrendsView = ({ workoutHistory, movements, settings }) => {
  const [selectedMovement, setSelectedMovement] = useState('');

  // Determine if the selected movement is an interval exercise
  const selectedIsInterval = useMemo(() => {
    if (!selectedMovement) return false;
    for (const workout of workoutHistory) {
      const exercise = workout.exercises.find(ex => ex.movementId === selectedMovement);
      if (exercise) return exercise.type === 'interval';
    }
    return false;
  }, [workoutHistory, selectedMovement]);

  // Chart data for sets-based exercises
  const setsChartData = useMemo(() => {
    if (!selectedMovement || selectedIsInterval) return [];

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
  }, [workoutHistory, selectedMovement, selectedIsInterval]);

  // Chart data for interval exercises
  const intervalChartData = useMemo(() => {
    if (!selectedMovement || !selectedIsInterval) return [];

    const data = [];

    workoutHistory.forEach(workout => {
      const exercise = workout.exercises.find(ex => ex.movementId === selectedMovement && ex.type === 'interval');
      if (exercise) {
        const blocks = exercise.blocks || [];
        const blockCount = blocks.length || 1;
        // Total work time = workDuration × rounds × number of blocks
        const totalWorkSeconds = (exercise.workDuration || 0) * (exercise.rounds || 0) * blockCount;

        data.push({
          date: new Date(workout.startTime).toLocaleDateString(),
          blocks: blockCount,
          totalWorkTime: totalWorkSeconds,
          totalWorkTimeLabel: formatTime(totalWorkSeconds),
          rounds: exercise.rounds || 0,
          workDuration: exercise.workDuration || 0,
          restDuration: exercise.restDuration || 0
        });
      }
    });

    return data.reverse();
  }, [workoutHistory, selectedMovement, selectedIsInterval]);

  // All movements that have history (both sets and interval)
  const movementsWithHistory = useMemo(() => {
    const movementIds = new Set();
    workoutHistory.forEach(workout => {
      workout.exercises.forEach(ex => {
        if (ex.type === 'interval') {
          movementIds.add(ex.movementId);
        } else if (ex.sets && ex.sets.length > 0) {
          movementIds.add(ex.movementId);
        }
      });
    });
    return movements.filter(m => movementIds.has(m.id));
  }, [workoutHistory, movements]);

  // Separate into groups for the dropdown
  const setsMovements = useMemo(() => {
    const ids = new Set();
    workoutHistory.forEach(workout => {
      workout.exercises.forEach(ex => {
        if (ex.type !== 'interval' && ex.sets && ex.sets.length > 0) ids.add(ex.movementId);
      });
    });
    return movements.filter(m => ids.has(m.id));
  }, [workoutHistory, movements]);

  const intervalMovements = useMemo(() => {
    const ids = new Set();
    workoutHistory.forEach(workout => {
      workout.exercises.forEach(ex => {
        if (ex.type === 'interval') ids.add(ex.movementId);
      });
    });
    return movements.filter(m => ids.has(m.id));
  }, [workoutHistory, movements]);

  const chartData = selectedIsInterval ? intervalChartData : setsChartData;
  const hasData = chartData.length > 0;

  // Build dropdown options with grouping
  const dropdownOptions = useMemo(() => {
    const options = [{ value: '', label: 'Choose an exercise to view trends...' }];
    if (setsMovements.length > 0) {
      options.push({ value: '__sets_header__', label: '── Sets / Reps ──', disabled: true });
      setsMovements.forEach(m => options.push({ value: m.id, label: m.name }));
    }
    if (intervalMovements.length > 0) {
      options.push({ value: '__interval_header__', label: '── Intervals ──', disabled: true });
      intervalMovements.forEach(m => options.push({ value: m.id, label: m.name }));
    }
    return options;
  }, [setsMovements, intervalMovements]);

  // Read chart colors from CSS variables
  const chartPrimary = getComputedStyle(document.documentElement).getPropertyValue('--chart-primary').trim() || '#059669';
  const chartSecondary = getComputedStyle(document.documentElement).getPropertyValue('--chart-secondary').trim() || '#10b981';
  const chartAccent = getComputedStyle(document.documentElement).getPropertyValue('--chart-accent').trim() || '#f59e0b';
  const chartGrid = getComputedStyle(document.documentElement).getPropertyValue('--chart-grid').trim() || '#e5e7eb';
  const chartText = getComputedStyle(document.documentElement).getPropertyValue('--chart-text').trim() || '#374151';

  // Custom tooltip for work time chart (show formatted time)
  const WorkTimeTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length > 0) {
      return (
        <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm px-3 py-2 text-sm">
          <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
          <p className="text-emerald-600 dark:text-emerald-400">
            Work Time: {formatTime(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <Select
          label="Select Exercise"
          value={selectedMovement}
          onChange={(e) => setSelectedMovement(e.target.value)}
          options={dropdownOptions}
        />
      </Card>

      {selectedMovement && hasData ? (
        <>
          {/* Sets-based charts */}
          {!selectedIsInterval && (
            <>
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Max Weight Over Time</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: chartText }} stroke={chartGrid} />
                      <YAxis tick={{ fontSize: 12, fill: chartText }} stroke={chartGrid} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg, #fff)', border: '1px solid var(--chart-grid)', borderRadius: '8px' }} />
                      <Legend wrapperStyle={{ color: chartText }} />
                      <Line
                        type="monotone"
                        dataKey="maxWeight"
                        stroke={chartPrimary}
                        strokeWidth={2}
                        name="Max Weight (lbs)"
                        dot={{ fill: chartPrimary }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Total Volume Over Time</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: chartText }} stroke={chartGrid} />
                      <YAxis tick={{ fontSize: 12, fill: chartText }} stroke={chartGrid} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg, #fff)', border: '1px solid var(--chart-grid)', borderRadius: '8px' }} />
                      <Legend wrapperStyle={{ color: chartText }} />
                      <Line
                        type="monotone"
                        dataKey="totalVolume"
                        stroke={chartSecondary}
                        strokeWidth={2}
                        name="Total Volume (lbs x reps)"
                        dot={{ fill: chartSecondary }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Sessions</h3>
                <div className="space-y-2">
                  {chartData.slice(-5).reverse().map((session, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-navy-900 rounded-lg">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{session.date}</span>
                      <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>Max: {session.maxWeight} lbs</span>
                        <span>{session.sets} sets</span>
                        <span>{session.totalReps} total reps</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* Interval-based charts */}
          {selectedIsInterval && (
            <>
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Blocks Per Session</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: chartText }} stroke={chartGrid} />
                      <YAxis tick={{ fontSize: 12, fill: chartText }} allowDecimals={false} stroke={chartGrid} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg, #fff)', border: '1px solid var(--chart-grid)', borderRadius: '8px' }} />
                      <Legend wrapperStyle={{ color: chartText }} />
                      <Line
                        type="monotone"
                        dataKey="blocks"
                        stroke={chartPrimary}
                        strokeWidth={2}
                        name="Blocks"
                        dot={{ fill: chartPrimary }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Total Work Time</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: chartText }} stroke={chartGrid} />
                      <YAxis
                        tick={{ fontSize: 12, fill: chartText }}
                        tickFormatter={(val) => formatTime(val)}
                        stroke={chartGrid}
                      />
                      <Tooltip content={<WorkTimeTooltip />} />
                      <Legend wrapperStyle={{ color: chartText }} />
                      <Line
                        type="monotone"
                        dataKey="totalWorkTime"
                        stroke={chartAccent}
                        strokeWidth={2}
                        name="Work Time"
                        dot={{ fill: chartAccent }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Sessions</h3>
                <div className="space-y-2">
                  {chartData.slice(-5).reverse().map((session, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-navy-900 rounded-lg">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{session.date}</span>
                      <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>{session.blocks} block{session.blocks !== 1 ? 's' : ''}</span>
                        <span>{formatTime(session.totalWorkTime)} work</span>
                        <span>{session.rounds} x {formatTime(session.workDuration)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </>
      ) : selectedMovement ? (
        <Card className="p-8">
          <div className="text-center text-gray-500 dark:text-gray-400">
            No workout data available for this exercise yet.
          </div>
        </Card>
      ) : (
        <Card className="p-8">
          <div className="text-center text-gray-500 dark:text-gray-400">
            Select an exercise to view your progress trends.
          </div>
        </Card>
      )}
    </div>
  );
};

export default TrendsView;
