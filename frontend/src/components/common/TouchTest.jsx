import React, { useState } from 'react';
import TouchButton from './TouchButton';
import TouchInput, { TouchTextarea } from './TouchInput';
import TouchModal, { TouchConfirmModal, TouchFormModal } from './TouchModal';
import TouchInteraction, { SwipeNavigation, LongPressItem } from './TouchInteraction';
import { getTouchTargetClasses, isTouchDevice } from '../../utils/responsive';

/**
 * Componente de prueba para verificar todas las interacciones táctiles
 */
const TouchTest = () => {
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [swipeCount, setSwipeCount] = useState(0);
  const [longPressCount, setLongPressCount] = useState(0);
  const [formData, setFormData] = useState({ name: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSwipeLeft = () => {
    setSwipeCount(prev => prev + 1);
    console.log('Swipe left detected');
  };

  const handleSwipeRight = () => {
    setSwipeCount(prev => prev + 1);
    console.log('Swipe right detected');
  };

  const handleLongPress = () => {
    setLongPressCount(prev => prev + 1);
    console.log('Long press detected');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simular carga
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Form submitted:', formData);
    setIsLoading(false);
    setShowFormModal(false);
    setFormData({ name: '', message: '' });
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    
    // Simular acción
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('Action confirmed');
    setIsLoading(false);
    setShowConfirmModal(false);
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold mb-6">Touch Interaction Test</h1>
        
        {/* Device Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Device Information</h2>
          <p className="text-sm text-gray-600">
            Touch Device: {isTouchDevice() ? 'Yes' : 'No'}
          </p>
          <p className="text-sm text-gray-600">
            Screen Width: {window.innerWidth}px
          </p>
          <p className="text-sm text-gray-600">
            User Agent: {navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}
          </p>
        </div>

        {/* Touch Buttons */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Touch Buttons</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <TouchButton variant="primary">Primary Button</TouchButton>
            <TouchButton variant="secondary">Secondary Button</TouchButton>
            <TouchButton variant="success">Success Button</TouchButton>
            <TouchButton variant="danger">Danger Button</TouchButton>
            <TouchButton variant="outline">Outline Button</TouchButton>
            <TouchButton variant="ghost">Ghost Button</TouchButton>
            <TouchButton variant="primary" loading={true}>Loading Button</TouchButton>
            <TouchButton variant="primary" disabled={true}>Disabled Button</TouchButton>
            <TouchButton variant="primary" size="small">Small Button</TouchButton>
            <TouchButton variant="primary" size="large">Large Button</TouchButton>
          </div>
        </div>

        {/* Touch Inputs */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Touch Inputs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TouchInput
              label="Name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
            <TouchInput
              label="Email"
              type="email"
              placeholder="Enter your email"
              required
            />
            <div className="sm:col-span-2">
              <TouchTextarea
                label="Message"
                placeholder="Enter your message"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                autoResize
              />
            </div>
          </div>
        </div>

        {/* Swipe Navigation */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Swipe Navigation</h2>
          <SwipeNavigation
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-8 text-center"
          >
            <div>
              <p className="text-lg font-medium text-blue-800 mb-2">
                Swipe Area
              </p>
              <p className="text-sm text-blue-600 mb-4">
                Swipe left or right on this area
              </p>
              <p className="text-lg font-bold text-blue-800">
                Swipes detected: {swipeCount}
              </p>
            </div>
          </SwipeNavigation>
        </div>

        {/* Long Press */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Long Press</h2>
          <LongPressItem
            onLongPress={handleLongPress}
            className="bg-green-50 border-2 border-dashed border-green-300 rounded-lg p-8 text-center cursor-pointer"
          >
            <div>
              <p className="text-lg font-medium text-green-800 mb-2">
                Long Press Area
              </p>
              <p className="text-sm text-green-600 mb-4">
                Press and hold for 500ms
              </p>
              <p className="text-lg font-bold text-green-800">
                Long presses detected: {longPressCount}
              </p>
            </div>
          </LongPressItem>
        </div>

        {/* Touch Targets */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Touch Target Sizes</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <button className={`bg-blue-500 text-white rounded ${getTouchTargetClasses('small')} px-3`}>
                40px Target
              </button>
              <button className={`bg-blue-500 text-white rounded ${getTouchTargetClasses()} px-3`}>
                44px Target (Recommended)
              </button>
              <button className={`bg-blue-500 text-white rounded ${getTouchTargetClasses('large')} px-3`}>
                48px Target
              </button>
            </div>
            <p className="text-sm text-gray-600">
              All buttons should be at least 44px in height and width for optimal touch interaction.
            </p>
          </div>
        </div>

        {/* Modal Tests */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Touch Modals</h2>
          <div className="flex flex-wrap gap-4">
            <TouchButton
              variant="primary"
              onClick={() => setShowModal(true)}
            >
              Basic Modal
            </TouchButton>
            <TouchButton
              variant="secondary"
              onClick={() => setShowConfirmModal(true)}
            >
              Confirm Modal
            </TouchButton>
            <TouchButton
              variant="success"
              onClick={() => setShowFormModal(true)}
            >
              Form Modal
            </TouchButton>
          </div>
        </div>

        {/* Touch Feedback */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Touch Feedback</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TouchInteraction
              showRipple={true}
              className="bg-purple-50 border-2 border-purple-300 rounded-lg p-6 text-center"
            >
              <p className="text-purple-800 font-medium">Ripple Effect</p>
              <p className="text-sm text-purple-600">Tap to see ripple</p>
            </TouchInteraction>
            <TouchInteraction
              showRipple={false}
              className="bg-orange-50 border-2 border-orange-300 rounded-lg p-6 text-center"
            >
              <p className="text-orange-800 font-medium">Scale Feedback</p>
              <p className="text-sm text-orange-600">Tap to see scale effect</p>
            </TouchInteraction>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TouchModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Basic Touch Modal"
        size="default"
      >
        <div className="space-y-4">
          <p>This is a basic touch-optimized modal.</p>
          <p>On mobile devices, you can swipe down to close it.</p>
          <p>It also handles proper focus management and keyboard navigation.</p>
        </div>
      </TouchModal>

      <TouchConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirm}
        title="Confirm Action"
        message="Are you sure you want to perform this action? This action cannot be undone."
        confirmText="Yes, Continue"
        cancelText="Cancel"
        isLoading={isLoading}
      />

      <TouchFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSubmit={handleFormSubmit}
        title="Touch Form Modal"
        submitText="Submit Form"
        isLoading={isLoading}
        canSubmit={formData.name.trim() !== ''}
      >
        <div className="space-y-4">
          <TouchInput
            label="Name"
            placeholder="Enter your name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
          <TouchTextarea
            label="Message"
            placeholder="Enter your message"
            value={formData.message}
            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
            rows={4}
          />
        </div>
      </TouchFormModal>
    </div>
  );
};

export default TouchTest;