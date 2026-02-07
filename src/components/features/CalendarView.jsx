import React, { useState, useMemo } from 'react';
import { getDateKey } from '../../utils/helpers';
import Icons from '../icons/Icons';
import Card from '../ui/Card';

const CalendarView = ({ workoutHistory }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const workoutsByDate = useMemo(() => {
    const map = {};
    workoutHistory.forEach(workout => {
      const dateKey = getDateKey(workout.startTime);
      if (!map[dateKey]) {
        map[dateKey] = [];
      }
      map[dateKey].push(workout);
    });
    return map;
  }, [workoutHistory]);

  const getDayColor = (dateKey) => {
    const workouts = workoutsByDate[dateKey];
    if (!workouts || workouts.length === 0) return null;

    let totalDifficulty = 0;
    let setCount = 0;

    workouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        exercise.sets.forEach(set => {
          if (set.difficulty > 0) {
            totalDifficulty += set.difficulty;
            setCount++;
          }
        });
      });
    });

    if (setCount === 0) return 'bg-gray-200 dark:bg-gray-700';

    const avgDifficulty = totalDifficulty / setCount;

    if (avgDifficulty <= 2) return 'bg-blue-400 text-white';
    if (avgDifficulty <= 3.5) return 'bg-orange-400 text-white';
    return 'bg-red-500 text-white';
  };

  const getMonthDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const days = getMonthDays();
  const today = getDateKey(new Date());

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-navy-900 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
          >
            <Icons.ChevronLeft />
          </button>
          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{monthName}</h3>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-navy-900 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
          >
            <Icons.ChevronRight />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">
              {day}
            </div>
          ))}

          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dateKey = getDateKey(date);
            const color = getDayColor(dateKey);
            const isToday = dateKey === today;
            const workouts = workoutsByDate[dateKey];

            return (
              <div
                key={dateKey}
                className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors ${
                  color || 'hover:bg-gray-100 dark:hover:bg-navy-900 text-gray-900 dark:text-gray-300'
                } ${isToday && !color ? 'ring-2 ring-emerald-500' : ''}`}
                title={workouts ? `${workouts.length} workout(s)` : ''}
              >
                <span className={isToday && !color ? 'font-bold text-emerald-600 dark:text-emerald-400' : ''}>
                  {date.getDate()}
                </span>
                {workouts && (
                  <div className="w-1.5 h-1.5 rounded-full bg-current mt-0.5 opacity-75" />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-center gap-6 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Easy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Moderate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Hard</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CalendarView;
