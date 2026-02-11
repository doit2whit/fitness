import React, { useState } from 'react';
import { generateId } from '../../utils/helpers';
import { DEFAULT_SETS, DEFAULT_WORK_DURATION, DEFAULT_REST_DURATION, DEFAULT_ROUNDS, TIER_LABELS } from '../../utils/constants';
import Icons from '../icons/Icons';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import Input from '../ui/Input';

// Compact inline stepper for numbers (sets, rounds)
const InlineStepper = ({ value, onChange, min = 1, max = 20, label }) => (
  <div className="flex items-center gap-1.5">
    {label && <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">{label}</span>}
    <button
      onClick={() => onChange(Math.max(min, value - 1))}
      className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-navy-900 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400"
      disabled={value <= min}
    >
      −
    </button>
    <span className="w-6 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</span>
    <button
      onClick={() => onChange(Math.min(max, value + 1))}
      className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-navy-900 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400"
      disabled={value >= max}
    >
      +
    </button>
  </div>
);

// Compact inline stepper for time values (work/rest duration)
const InlineTimeStepper = ({ value, onChange, min = 0, max = 600, step = 5, label }) => {
  const formatSeconds = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  return (
    <div className="flex items-center gap-1.5">
      {label && <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">{label}</span>}
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-navy-900 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400"
        disabled={value <= min}
      >
        −
      </button>
      <span className="w-10 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">{formatSeconds(value)}</span>
      <button
        onClick={() => onChange(Math.min(max, value + step))}
        className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-navy-900 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400"
        disabled={value >= max}
      >
        +
      </button>
    </div>
  );
};

// Per-movement config panel shown below each selected movement
const MovementConfig = ({ config, movementName, onUpdate, defaultUnit }) => {
  const tierOptions = [1, 2, 3, 4];

  return (
    <div className="ml-3 mt-1 mb-2 p-3 bg-gray-50 dark:bg-navy-900 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
      {/* Type toggle: Sets vs Interval */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">Type:</span>
        <div className="flex rounded-md bg-gray-200 dark:bg-gray-700 p-0.5">
          <button
            onClick={() => onUpdate({ type: 'sets' })}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              config.type === 'sets'
                ? 'bg-white dark:bg-navy-800 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Sets
          </button>
          <button
            onClick={() => onUpdate({ type: 'interval' })}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              config.type === 'interval'
                ? 'bg-white dark:bg-navy-800 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Interval
          </button>
        </div>
      </div>

      {/* Sets-specific config */}
      {config.type === 'sets' && (
        <div className="flex flex-wrap items-center gap-4">
          <InlineStepper
            label="Sets:"
            value={config.sets || DEFAULT_SETS}
            onChange={(v) => onUpdate({ sets: v })}
            min={1}
            max={20}
          />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 dark:text-gray-400">Unit:</span>
            <button
              onClick={() => onUpdate({ unit: (config.unit || defaultUnit) === 'lbs' ? 'kg' : 'lbs' })}
              className="px-2 py-0.5 text-xs rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium transition-colors"
            >
              {config.unit || defaultUnit}
            </button>
          </div>
        </div>
      )}

      {/* Interval-specific config */}
      {config.type === 'interval' && (
        <div className="flex flex-wrap items-center gap-4">
          <InlineTimeStepper
            label="Work:"
            value={config.workDuration || DEFAULT_WORK_DURATION}
            onChange={(v) => onUpdate({ workDuration: v })}
            min={5}
            max={600}
          />
          <InlineTimeStepper
            label="Rest:"
            value={config.restDuration || DEFAULT_REST_DURATION}
            onChange={(v) => onUpdate({ restDuration: v })}
            min={0}
            max={300}
          />
          <InlineStepper
            label="Rounds:"
            value={config.rounds || DEFAULT_ROUNDS}
            onChange={(v) => onUpdate({ rounds: v })}
            min={1}
            max={50}
          />
        </div>
      )}

      {/* Tier selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">Tier:</span>
        {tierOptions.map(t => (
          <button
            key={t}
            onClick={() => onUpdate({ tier: config.tier === t ? null : t })}
            className={`px-2 py-0.5 text-xs rounded font-medium transition-colors ${
              config.tier === t
                ? t === 1 ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700'
                : t === 2 ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700'
                : t === 3 ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700'
                : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-transparent hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {TIER_LABELS[t]}
          </button>
        ))}
        {config.tier && (
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
            ({config.tier === 1 ? '6' : config.tier === 2 ? '10' : config.tier === 3 ? '12' : '15'} rep target)
          </span>
        )}
      </div>
    </div>
  );
};

const WorkoutTemplates = ({ templates, setTemplates, movements, settings, deletedDefaultTemplates, setDeletedDefaultTemplates }) => {
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', movements: [] });
  const [editingTemplate, setEditingTemplate] = useState(null);

  const defaultUnit = settings?.defaultUnit || 'lbs';

  const getMovementName = (id) => movements.find(m => m.id === id)?.name || 'Unknown';
  const getMovementId = (entry) => typeof entry === 'string' ? entry : entry.movementId;

  const isMovementSelected = (movementsList, movementId) =>
    movementsList.some(m => getMovementId(m) === movementId);

  const getMovementConfig = (movementsList, movementId) =>
    movementsList.find(m => getMovementId(m) === movementId);

  const handleCreateTemplate = () => {
    if (!newTemplate.name.trim() || newTemplate.movements.length === 0) return;
    const template = {
      id: generateId(),
      name: newTemplate.name.trim(),
      movements: newTemplate.movements
    };
    setTemplates([...templates, template]);
    setNewTemplate({ name: '', movements: [] });
    setShowCreateTemplate(false);
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplate?.name.trim()) return;
    setTemplates(templates.map(t => t.id === editingTemplate.id ? editingTemplate : t));
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (id) => {
    // Track deleted default templates so they don't re-appear on reload
    if (id.startsWith('default_')) {
      setDeletedDefaultTemplates([...deletedDefaultTemplates, id]);
    }
    setTemplates(templates.filter(t => t.id !== id));
  };

  const toggleMovement = (movementId, isNew = false) => {
    const target = isNew ? newTemplate : editingTemplate;
    const setter = isNew ? setNewTemplate : setEditingTemplate;
    if (!target) return;

    const existing = isMovementSelected(target.movements, movementId);
    if (existing) {
      setter({
        ...target,
        movements: target.movements.filter(m => getMovementId(m) !== movementId)
      });
    } else {
      setter({
        ...target,
        movements: [...target.movements, {
          movementId,
          type: 'sets',
          sets: DEFAULT_SETS,
          unit: null,
          tier: null,
          workDuration: DEFAULT_WORK_DURATION,
          restDuration: DEFAULT_REST_DURATION,
          rounds: DEFAULT_ROUNDS
        }]
      });
    }
  };

  const updateMovementConfig = (movementId, updates, isNew = false) => {
    const target = isNew ? newTemplate : editingTemplate;
    const setter = isNew ? setNewTemplate : setEditingTemplate;
    if (!target) return;

    setter({
      ...target,
      movements: target.movements.map(m =>
        getMovementId(m) === movementId ? { ...m, ...updates } : m
      )
    });
  };

  // Shared movement list + config UI for create/edit modals
  const renderMovementSelector = (template, isNew) => (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Movements</label>
        <div className="max-h-48 overflow-y-auto space-y-1">
          {movements.map(movement => (
            <button
              key={movement.id}
              onClick={() => toggleMovement(movement.id, isNew)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                isMovementSelected(template.movements, movement.id)
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border-2 border-emerald-300 dark:border-emerald-600'
                  : 'bg-gray-50 dark:bg-navy-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
              }`}
            >
              {movement.name}
            </button>
          ))}
        </div>
      </div>

      {/* Per-movement config panels */}
      {template.movements.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Configure Movements</label>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {template.movements.map(entry => {
              const id = getMovementId(entry);
              const config = typeof entry === 'object' ? entry : {};
              return (
                <div key={id}>
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200 px-1 flex items-center gap-2">
                    {getMovementName(id)}
                    {config.type === 'interval' && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">interval</span>
                    )}
                    {config.tier && (
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        config.tier === 1 ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                        : config.tier === 2 ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'
                        : config.tier === 3 ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
                        : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                      }`}>
                        {TIER_LABELS[config.tier]}
                      </span>
                    )}
                  </div>
                  <MovementConfig
                    config={config}
                    movementName={getMovementName(id)}
                    onUpdate={(updates) => updateMovementConfig(id, updates, isNew)}
                    defaultUnit={defaultUnit}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Workout Templates</h3>
        <Button size="sm" onClick={() => setShowCreateTemplate(true)}>
          <Icons.Plus /> Create Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No templates yet. Create one to quickly start workouts!
        </div>
      ) : (
        <div className="grid gap-3">
          {templates.map(template => (
            <Card key={template.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">{template.name}</h4>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {template.movements.map(entry => {
                      const id = getMovementId(entry);
                      const config = typeof entry === 'object' ? entry : {};
                      return (
                        <span key={id} className="inline-flex items-center gap-1">
                          <Badge color={config.type === 'interval' ? 'purple' : 'blue'}>
                            {getMovementName(id)}
                          </Badge>
                          {config.tier && (
                            <span className={`text-xs px-1 py-0.5 rounded font-bold leading-none ${
                              config.tier === 1 ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                              : config.tier === 2 ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400'
                              : config.tier === 3 ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400'
                              : 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'
                            }`}>
                              {TIER_LABELS[config.tier]}
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingTemplate(template)}
                    className="text-gray-400 dark:text-gray-500 hover:text-emerald-600"
                  >
                    <Icons.Edit />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-gray-400 dark:text-gray-500 hover:text-red-600"
                  >
                    <Icons.Trash />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showCreateTemplate} onClose={() => setShowCreateTemplate(false)} title="Create Workout Template">
        <div className="space-y-4">
          <Input
            label="Template Name"
            value={newTemplate.name}
            onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
            placeholder="e.g., Push Day, Leg Day"
          />
          {renderMovementSelector(newTemplate, true)}
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowCreateTemplate(false)}>Cancel</Button>
            <Button onClick={handleCreateTemplate} disabled={!newTemplate.name.trim() || newTemplate.movements.length === 0}>
              Create Template
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!editingTemplate} onClose={() => setEditingTemplate(null)} title="Edit Workout Template">
        {editingTemplate && (
          <div className="space-y-4">
            <Input
              label="Template Name"
              value={editingTemplate.name}
              onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
            />
            {renderMovementSelector(editingTemplate, false)}
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setEditingTemplate(null)}>Cancel</Button>
              <Button onClick={handleUpdateTemplate}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WorkoutTemplates;
