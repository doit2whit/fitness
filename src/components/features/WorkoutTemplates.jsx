import React, { useState } from 'react';
import { generateId } from '../../utils/helpers';
import Icons from '../icons/Icons';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import Input from '../ui/Input';

const WorkoutTemplates = ({ templates, setTemplates, movements }) => {
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', movements: [] });
  const [editingTemplate, setEditingTemplate] = useState(null);

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
    setTemplates(templates.filter(t => t.id !== id));
  };

  const toggleMovement = (movementId, isNew = false) => {
    if (isNew) {
      const current = newTemplate.movements;
      setNewTemplate({
        ...newTemplate,
        movements: current.includes(movementId)
          ? current.filter(m => m !== movementId)
          : [...current, movementId]
      });
    } else if (editingTemplate) {
      const current = editingTemplate.movements;
      setEditingTemplate({
        ...editingTemplate,
        movements: current.includes(movementId)
          ? current.filter(m => m !== movementId)
          : [...current, movementId]
      });
    }
  };

  const getMovementName = (id) => movements.find(m => m.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Workout Templates</h3>
        <Button size="sm" onClick={() => setShowCreateTemplate(true)}>
          <Icons.Plus /> Create Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No templates yet. Create one to quickly start workouts!
        </div>
      ) : (
        <div className="grid gap-3">
          {templates.map(template => (
            <Card key={template.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{template.name}</h4>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {template.movements.map(movementId => (
                      <Badge key={movementId} color="blue">
                        {getMovementName(movementId)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingTemplate(template)}
                    className="text-gray-400 hover:text-indigo-600"
                  >
                    <Icons.Edit />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-gray-400 hover:text-red-600"
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Movements</label>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {movements.map(movement => (
                <button
                  key={movement.id}
                  onClick={() => toggleMovement(movement.id, true)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    newTemplate.movements.includes(movement.id)
                      ? 'bg-indigo-100 text-indigo-800 border-2 border-indigo-300'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  {movement.name}
                </button>
              ))}
            </div>
          </div>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Movements</label>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {movements.map(movement => (
                  <button
                    key={movement.id}
                    onClick={() => toggleMovement(movement.id, false)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      editingTemplate.movements.includes(movement.id)
                        ? 'bg-indigo-100 text-indigo-800 border-2 border-indigo-300'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    {movement.name}
                  </button>
                ))}
              </div>
            </div>
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
