import React, { useState } from 'react';
import { generateId } from '../../utils/helpers';
import Icons from '../icons/Icons';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import Input from '../ui/Input';

const MovementManager = ({ movements, setMovements, bodyParts, setBodyParts }) => {
  const [showAddMovement, setShowAddMovement] = useState(false);
  const [showAddBodyPart, setShowAddBodyPart] = useState(false);
  const [newMovement, setNewMovement] = useState({ name: '', bodyParts: [] });
  const [newBodyPart, setNewBodyPart] = useState('');
  const [editingMovement, setEditingMovement] = useState(null);

  const handleAddMovement = () => {
    if (!newMovement.name.trim()) return;
    const movement = {
      id: generateId(),
      name: newMovement.name.trim(),
      bodyParts: newMovement.bodyParts
    };
    setMovements([...movements, movement]);
    setNewMovement({ name: '', bodyParts: [] });
    setShowAddMovement(false);
  };

  const handleUpdateMovement = () => {
    if (!editingMovement?.name.trim()) return;
    setMovements(movements.map(m => m.id === editingMovement.id ? editingMovement : m));
    setEditingMovement(null);
  };

  const handleDeleteMovement = (id) => {
    setMovements(movements.filter(m => m.id !== id));
  };

  const handleAddBodyPart = () => {
    if (!newBodyPart.trim() || bodyParts.includes(newBodyPart.trim())) return;
    setBodyParts([...bodyParts, newBodyPart.trim()]);
    setNewBodyPart('');
    setShowAddBodyPart(false);
  };

  const handleDeleteBodyPart = (part) => {
    setBodyParts(bodyParts.filter(p => p !== part));
    setMovements(movements.map(m => ({
      ...m,
      bodyParts: m.bodyParts.filter(bp => bp !== part)
    })));
  };

  const toggleBodyPart = (part, isNew = false) => {
    if (isNew) {
      const current = newMovement.bodyParts;
      setNewMovement({
        ...newMovement,
        bodyParts: current.includes(part)
          ? current.filter(p => p !== part)
          : [...current, part]
      });
    } else if (editingMovement) {
      const current = editingMovement.bodyParts;
      setEditingMovement({
        ...editingMovement,
        bodyParts: current.includes(part)
          ? current.filter(p => p !== part)
          : [...current, part]
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Body Parts</h3>
          <Button size="sm" onClick={() => setShowAddBodyPart(true)}>
            <Icons.Plus /> Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {bodyParts.map(part => (
            <div key={part} className="flex items-center gap-1 bg-gray-100 dark:bg-navy-900 rounded-full px-3 py-1">
              <span className="text-sm">{part}</span>
              <button
                onClick={() => handleDeleteBodyPart(part)}
                className="text-gray-400 dark:text-gray-500 hover:text-red-500 ml-1"
              >
                <Icons.X />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Movements</h3>
          <Button size="sm" onClick={() => setShowAddMovement(true)}>
            <Icons.Plus /> Add Movement
          </Button>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {movements.map(movement => (
            <div
              key={movement.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-navy-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{movement.name}</div>
                <div className="flex gap-1 mt-1">
                  {movement.bodyParts.map(part => (
                    <Badge key={part} color="emerald">{part}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingMovement(movement)}
                  className="text-gray-400 dark:text-gray-500 hover:text-emerald-600"
                >
                  <Icons.Edit />
                </button>
                <button
                  onClick={() => handleDeleteMovement(movement.id)}
                  className="text-gray-400 dark:text-gray-500 hover:text-red-600"
                >
                  <Icons.Trash />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal isOpen={showAddBodyPart} onClose={() => setShowAddBodyPart(false)} title="Add Body Part">
        <div className="space-y-4">
          <Input
            label="Body Part Name"
            value={newBodyPart}
            onChange={(e) => setNewBodyPart(e.target.value)}
            placeholder="e.g., Forearms"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowAddBodyPart(false)}>Cancel</Button>
            <Button onClick={handleAddBodyPart}>Add</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showAddMovement} onClose={() => setShowAddMovement(false)} title="Add Movement">
        <div className="space-y-4">
          <Input
            label="Movement Name"
            value={newMovement.name}
            onChange={(e) => setNewMovement({ ...newMovement, name: e.target.value })}
            placeholder="e.g., Incline Dumbbell Press"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Body Parts</label>
            <div className="flex flex-wrap gap-2">
              {bodyParts.map(part => (
                <button
                  key={part}
                  onClick={() => toggleBodyPart(part, true)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    newMovement.bodyParts.includes(part)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 dark:bg-navy-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {part}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowAddMovement(false)}>Cancel</Button>
            <Button onClick={handleAddMovement}>Add Movement</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!editingMovement} onClose={() => setEditingMovement(null)} title="Edit Movement">
        {editingMovement && (
          <div className="space-y-4">
            <Input
              label="Movement Name"
              value={editingMovement.name}
              onChange={(e) => setEditingMovement({ ...editingMovement, name: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Body Parts</label>
              <div className="flex flex-wrap gap-2">
                {bodyParts.map(part => (
                  <button
                    key={part}
                    onClick={() => toggleBodyPart(part, false)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      editingMovement.bodyParts.includes(part)
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 dark:bg-navy-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {part}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setEditingMovement(null)}>Cancel</Button>
              <Button onClick={handleUpdateMovement}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MovementManager;
