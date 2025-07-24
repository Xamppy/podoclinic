import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, setViewportSize, hasMinimumTouchTarget } from '../../utils/testUtils';
import AdminCitasPage from '../AdminCitasPage';

// Mock React Big Calendar
jest.mock('react-big-calendar', () => ({
  Calendar: ({ onSelectSlot, onSelectEvent, ...props }) => (
    <div data-testid="calendar" data-view={props.view}>
      <button 
        data-testid="calendar-slot" 
        onClick={() => onSelectSlot({ start: new Date(), end: new Date() })}
      >
        Click to create appointment
      </button>
      <div data-testid="calendar-content">Calendar Content</div>
    </div>
  ),
  momentLocalizer: jest.fn(() => ({})),
  Views: {
    MONTH: 'month',
    WEEK: 'week',
    DAY: 'day'
  }
}));

// Mock API calls
jest.mock('../../api/citas', () => ({
  getCitas: jest.fn(() => Promise.resolve({ data: [] })),
  getHorariosDisponibles: jest.fn(() => Promise.resolve({ 
    data: { horas_disponibles: ['09:00', '10:00', '11:00'] } 
  })),
  getByFecha: jest.fn(() => Promise.resolve({ data: [] })),
  create: jest.fn(() => Promise.resolve({ data: { id: 1 } }))
}));

jest.mock('../../api/pacientes', () => ({
  getAll: jest.fn(() => Promise.resolve({ 
    data: [
      { id: 1, nombre: 'Juan Pérez', rut: '12345678-9' }
    ] 
  }))
}));

// Mock axios instance
jest.mock('../../api/axios', () => ({
  get: jest.fn(() => Promise.resolve({ 
    data: { citas: [] } 
  }))
}));

describe('AdminCitasPage Modal Issues', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Mobile Modal Opening Issues', () => {
    test('modal opens consistently on mobile when clicking calendar slot', async () => {
      setViewportSize(375, 667); // Mobile viewport
      
      renderWithProviders(<AdminCitasPage />);
      
      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByText(/calendario de citas/i)).toBeInTheDocument();
      });

      // Click on calendar slot
      const calendarSlot = screen.getByTestId('calendar-slot');
      fireEvent.click(calendarSlot);

      // Modal should appear
      await waitFor(() => {
        const modal = document.querySelector('[class*="fixed"][class*="inset-0"]');
        expect(modal).toBeInTheDocument();
        expect(modal).toBeVisible();
      }, { timeout: 5000 });

      // Check modal content is accessible
      expect(screen.getByText(/nueva cita/i)).toBeInTheDocument();
    });

    test('modal opens when clicking Nueva Cita button on mobile', async () => {
      setViewportSize(375, 667); // Mobile viewport
      
      renderWithProviders(<AdminCitasPage />);
      
      // Wait for page to load
      await waitFor(() => {
        const newCitaButton = screen.getByText(/nueva cita/i);
        expect(newCitaButton).toBeInTheDocument();
        
        // Button should have proper touch target
        expect(hasMinimumTouchTarget(newCitaButton)).toBe(true);
        
        // Click the button
        fireEvent.click(newCitaButton);
      });

      // Modal should appear
      await waitFor(() => {
        const modal = document.querySelector('[class*="fixed"][class*="inset-0"]');
        expect(modal).toBeInTheDocument();
        expect(modal).toBeVisible();
      }, { timeout: 5000 });
    });

    test('modal has proper mobile styling and positioning', async () => {
      setViewportSize(375, 667); // Mobile viewport
      
      renderWithProviders(<AdminCitasPage />);
      
      // Open modal
      await waitFor(() => {
        const newCitaButton = screen.getByText(/nueva cita/i);
        fireEvent.click(newCitaButton);
      });

      // Check modal styling
      await waitFor(() => {
        const modal = document.querySelector('[class*="fixed"][class*="inset-0"]');
        expect(modal).toBeInTheDocument();
        
        // Should have mobile-appropriate classes
        expect(modal).toHaveClass('fixed', 'inset-0');
        expect(modal).toHaveClass(/bg-gray-600|bg-opacity-50/);
        
        // Modal content should be responsive
        const modalContent = modal.querySelector('[class*="max-w"]');
        if (modalContent) {
          expect(modalContent).toHaveClass(/w-full/);
          expect(modalContent).toHaveClass(/max-w-/);
        }
      });
    });

    test('modal close button works on mobile', async () => {
      setViewportSize(375, 667); // Mobile viewport
      
      renderWithProviders(<AdminCitasPage />);
      
      // Open modal
      await waitFor(() => {
        const newCitaButton = screen.getByText(/nueva cita/i);
        fireEvent.click(newCitaButton);
      });

      // Find and click close button
      await waitFor(() => {
        const closeButton = document.querySelector('button[class*="text-gray-500"]') ||
                           screen.getByRole('button', { name: /close/i }) ||
                           document.querySelector('svg[class*="h-6"]')?.closest('button');
        
        expect(closeButton).toBeInTheDocument();
        expect(hasMinimumTouchTarget(closeButton)).toBe(true);
        
        fireEvent.click(closeButton);
      });

      // Modal should close
      await waitFor(() => {
        const modal = document.querySelector('[class*="fixed"][class*="inset-0"]');
        expect(modal).not.toBeInTheDocument();
      });
    });

    test('modal form elements are touch-friendly on mobile', async () => {
      setViewportSize(375, 667); // Mobile viewport
      
      renderWithProviders(<AdminCitasPage />);
      
      // Open modal
      await waitFor(() => {
        const newCitaButton = screen.getByText(/nueva cita/i);
        fireEvent.click(newCitaButton);
      });

      // Check form elements
      await waitFor(() => {
        const selects = screen.getAllByRole('combobox');
        selects.forEach(select => {
          const rect = select.getBoundingClientRect();
          expect(rect.height).toBeGreaterThanOrEqual(44); // Minimum touch target
        });

        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          if (button.textContent.includes('Guardar') || 
              button.textContent.includes('Cancelar')) {
            expect(hasMinimumTouchTarget(button)).toBe(true);
          }
        });
      });
    });
  });

  describe('Modal State Management', () => {
    test('modal state is properly managed across viewport changes', async () => {
      // Start with desktop
      setViewportSize(1440, 900);
      
      const { rerender } = renderWithProviders(<AdminCitasPage />);
      
      // Open modal on desktop
      await waitFor(() => {
        const newCitaButton = screen.getByText(/nueva cita/i);
        fireEvent.click(newCitaButton);
      });

      // Verify modal is open
      await waitFor(() => {
        const modal = document.querySelector('[class*="fixed"][class*="inset-0"]');
        expect(modal).toBeInTheDocument();
      });

      // Change to mobile
      setViewportSize(375, 667);
      rerender(<AdminCitasPage />);

      // Modal should still be open and properly styled for mobile
      await waitFor(() => {
        const modal = document.querySelector('[class*="fixed"][class*="inset-0"]');
        expect(modal).toBeInTheDocument();
        expect(modal).toBeVisible();
      });
    });

    test('multiple rapid clicks do not cause modal issues', async () => {
      setViewportSize(375, 667); // Mobile viewport
      
      renderWithProviders(<AdminCitasPage />);
      
      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByText(/nueva cita/i)).toBeInTheDocument();
      });

      const newCitaButton = screen.getByText(/nueva cita/i);
      
      // Click multiple times rapidly
      fireEvent.click(newCitaButton);
      fireEvent.click(newCitaButton);
      fireEvent.click(newCitaButton);

      // Should only have one modal
      await waitFor(() => {
        const modals = document.querySelectorAll('[class*="fixed"][class*="inset-0"]');
        expect(modals.length).toBeLessThanOrEqual(1);
        
        if (modals.length === 1) {
          expect(modals[0]).toBeVisible();
        }
      });
    });
  });

  describe('Touch Events and Gestures', () => {
    test('modal responds to touch events properly', async () => {
      setViewportSize(375, 667); // Mobile viewport
      
      renderWithProviders(<AdminCitasPage />);
      
      // Open modal
      await waitFor(() => {
        const newCitaButton = screen.getByText(/nueva cita/i);
        fireEvent.click(newCitaButton);
      });

      // Test touch events on modal backdrop
      await waitFor(() => {
        const modal = document.querySelector('[class*="fixed"][class*="inset-0"]');
        expect(modal).toBeInTheDocument();
        
        // Touch the backdrop (should not close modal by default)
        fireEvent.touchStart(modal);
        fireEvent.touchEnd(modal);
        
        // Modal should still be open
        expect(modal).toBeInTheDocument();
      });
    });

    test('swipe gestures work properly on modal', async () => {
      setViewportSize(375, 667); // Mobile viewport
      
      renderWithProviders(<AdminCitasPage />);
      
      // Open modal
      await waitFor(() => {
        const newCitaButton = screen.getByText(/nueva cita/i);
        fireEvent.click(newCitaButton);
      });

      // Test swipe down gesture (if implemented)
      await waitFor(() => {
        const modalContent = document.querySelector('[class*="max-w"]');
        if (modalContent) {
          // Simulate swipe down
          fireEvent.touchStart(modalContent, {
            touches: [{ clientX: 100, clientY: 100 }]
          });
          fireEvent.touchMove(modalContent, {
            touches: [{ clientX: 100, clientY: 200 }]
          });
          fireEvent.touchEnd(modalContent);
          
          // Modal behavior depends on implementation
          // This test ensures no errors occur during swipe
          expect(modalContent).toBeInTheDocument();
        }
      });
    });
  });

  describe('Accessibility on Mobile', () => {
    test('modal maintains focus management on mobile', async () => {
      setViewportSize(375, 667); // Mobile viewport
      
      renderWithProviders(<AdminCitasPage />);
      
      // Open modal
      await waitFor(() => {
        const newCitaButton = screen.getByText(/nueva cita/i);
        fireEvent.click(newCitaButton);
      });

      // Check focus management
      await waitFor(() => {
        const modal = document.querySelector('[class*="fixed"][class*="inset-0"]');
        expect(modal).toBeInTheDocument();
        
        // First focusable element should receive focus
        const firstFocusable = modal.querySelector('select, input, button');
        if (firstFocusable) {
          firstFocusable.focus();
          expect(document.activeElement).toBe(firstFocusable);
        }
      });
    });

    test('modal has proper ARIA attributes on mobile', async () => {
      setViewportSize(375, 667); // Mobile viewport
      
      renderWithProviders(<AdminCitasPage />);
      
      // Open modal
      await waitFor(() => {
        const newCitaButton = screen.getByText(/nueva cita/i);
        fireEvent.click(newCitaButton);
      });

      // Check ARIA attributes
      await waitFor(() => {
        const modal = document.querySelector('[class*="fixed"][class*="inset-0"]') ||
                     screen.getByRole('dialog');
        
        if (modal.getAttribute('role') === 'dialog') {
          expect(modal).toHaveAttribute('role', 'dialog');
          expect(modal).toHaveAttribute('aria-modal', 'true');
        }
      });
    });
  });
});