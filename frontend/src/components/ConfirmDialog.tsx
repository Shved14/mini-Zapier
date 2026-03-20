import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Подтвердить",
  cancelText = "Отмена"
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 shadow-2xl transition-all">
                {/* Градиентная рамка */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600/20 to-blue-600/20 blur-sm -z-10"></div>

                <div className="p-6">
                  {/* Заголовок с иконкой */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <Dialog.Title className="text-lg font-semibold text-white">
                      {title}
                    </Dialog.Title>
                  </div>

                  {/* Сообщение */}
                  <Dialog.Description className="text-gray-300 mb-6 leading-relaxed">
                    {message}
                  </Dialog.Description>

                  {/* Кнопки */}
                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      className="flex-1 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-600/50 text-gray-300 rounded-lg font-medium transition-all duration-200 border border-slate-600/50 hover:border-slate-500/50"
                    >
                      {cancelText}
                    </button>
                    <button
                      onClick={handleConfirm}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {confirmText}
                    </button>
                  </div>
                </div>

                {/* Декоративные элементы */}
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-purple-500/50 blur-sm"></div>
                <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-blue-500/50 blur-sm"></div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// Хук для использования диалога
export function useConfirmDialog() {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    resolve: (value: boolean) => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    resolve: () => { }
  });

  const showConfirmDialog = (title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title,
        message,
        resolve
      });
    });
  };

  const hideDialog = () => {
    setDialogState((prev: typeof dialogState) => ({ ...prev, isOpen: false }));
  };

  const handleConfirm = () => {
    dialogState.resolve(true);
    hideDialog();
  };

  const handleCancel = () => {
    dialogState.resolve(false);
    hideDialog();
  };

  const ConfirmDialogComponent = () => (
    <ConfirmDialog
      isOpen={dialogState.isOpen}
      onClose={handleCancel}
      onConfirm={handleConfirm}
      title={dialogState.title}
      message={dialogState.message}
    />
  );

  return { showConfirmDialog, ConfirmDialogComponent };
}
