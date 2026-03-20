import { create } from 'zustand';
import { Workflow } from '../api/workflows';

interface WorkflowState {
  // Current workflow being edited
  currentWorkflow: Workflow | null;
  unsavedChanges: boolean;
  isEditing: boolean;
  
  // Actions
  setCurrentWorkflow: (workflow: Workflow) => void;
  setUnsavedChanges: (hasChanges: boolean) => void;
  setIsEditing: (editing: boolean) => void;
  updateWorkflowJson: (workflowJson: any) => void;
  resetEditing: () => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  currentWorkflow: null,
  unsavedChanges: false,
  isEditing: false,

  setCurrentWorkflow: (workflow) => {
    set({ 
      currentWorkflow: workflow,
      unsavedChanges: false,
      isEditing: true
    });
  },

  setUnsavedChanges: (hasChanges) => {
    set({ unsavedChanges: hasChanges });
  },

  setIsEditing: (editing) => {
    set({ isEditing: editing });
  },

  updateWorkflowJson: (workflowJson) => {
    const { currentWorkflow } = get();
    if (currentWorkflow) {
      set({
        currentWorkflow: {
          ...currentWorkflow,
          workflowJson
        },
        unsavedChanges: true
      });
    }
  },

  resetEditing: () => {
    set({
      currentWorkflow: null,
      unsavedChanges: false,
      isEditing: false
    });
  }
}));
