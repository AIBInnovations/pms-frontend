import { useState } from 'react';
import { Button, Select, Modal } from '../../components/ui';
import { TASK_PRIORITIES, TASK_STAGES } from '../../utils/constants';

function BulkActionBar({ selectedCount, onAction, onClear }) {
  const [modalType, setModalType] = useState(null);
  const [modalValue, setModalValue] = useState('');

  const openModal = (type) => {
    setModalType(type);
    setModalValue('');
  };

  const closeModal = () => {
    setModalType(null);
    setModalValue('');
  };

  const handleApply = () => {
    if (modalType === 'priority') {
      onAction('change_priority', modalValue);
    } else if (modalType === 'stage') {
      onAction('change_stage', modalValue);
    }
    closeModal();
  };

  const modalTitle = modalType === 'priority' ? 'Change Priority' : 'Change Stage';
  const modalOptions = modalType === 'priority' ? TASK_PRIORITIES : TASK_STAGES;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 px-5 py-3 flex items-center gap-4">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {selectedCount} selected
          </span>

          <Button variant="secondary" size="sm" onClick={() => openModal('priority')}>
            Change Priority
          </Button>

          <Button variant="secondary" size="sm" onClick={() => openModal('stage')}>
            Change Stage
          </Button>

          <Button variant="secondary" size="sm" onClick={() => onAction('archive')}>
            Archive
          </Button>

          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear
          </Button>
        </div>
      </div>

      <Modal open={modalType !== null} onClose={closeModal} title={modalTitle}>
        <Select
          value={modalValue}
          onChange={(value) => setModalValue(value)}
          options={modalOptions}
        />
        <div className="flex items-center gap-2 mt-4 justify-end">
          <Button variant="ghost" size="sm" onClick={closeModal}>
            Cancel
          </Button>
          <Button variant="secondary" size="sm" onClick={handleApply}>
            Apply
          </Button>
        </div>
      </Modal>
    </>
  );
}

export default BulkActionBar;
