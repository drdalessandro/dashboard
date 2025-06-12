// src/components/examples/OfflineDataExample.tsx
// Example component to demonstrate the offline data capabilities

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  usePatients,
  useCreatePatient,
  useUpdatePatient,
  useDeletePatient,
  formatPatientName
} from '../../data';
import NetworkStatusIndicator from '../ui/NetworkStatusIndicator';
import { Patient } from '@medplum/fhirtypes';

/**
 * OfflineDataExample
 * 
 * This component demonstrates the offline data capabilities of the platform.
 * It shows how to:
 * - Fetch a list of patients with offline support
 * - Create new patients even when offline
 * - Update existing patients even when offline
 * - Delete patients even when offline
 * - Show sync status and handle sync events
 */
const OfflineDataExample: React.FC = () => {
  const { t } = useTranslation();
  const [newPatientName, setNewPatientName] = useState('');
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [editName, setEditName] = useState('');

  // Get patient data with offline support
  const { data: patients, loading, error, refetch } = usePatients();

  // Mutation hooks for creating, updating and deleting patients
  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient();
  const deletePatient = useDeletePatient();

  // Handle creating a new patient
  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim()) return;

    try {
      // Create a new patient
      await createPatient.mutate({
        resourceType: 'Patient' as const,
        name: [
          {
            family: newPatientName.split(' ').slice(1).join(' '),
            given: [newPatientName.split(' ')[0]],
            use: 'official'
          }
        ],
        active: true
      });

      setNewPatientName('');
      refetch();
    } catch (error) {
      console.error('Error creating patient:', error);
    }
  };

  // Handle starting to edit a patient
  const handleStartEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setEditName(formatPatientName(patient));
  };

  // Handle saving edits to a patient
  const handleSaveEdit = async () => {
    if (!editingPatient || !editName.trim()) return;

    try {
      // Split the name into family and given parts
      const nameParts = editName.split(' ');
      const given = [nameParts[0]];
      const family = nameParts.slice(1).join(' ');

      // Update the patient with the new name
      const updatedPatient: Partial<Patient> = {
        resourceType: 'Patient' as const,
        name: [
          {
            family,
            given,
            use: 'official'
          }
        ]
      };

      await updatePatient.mutate(editingPatient.id!, updatedPatient);

      setEditingPatient(null);
      setEditName('');
      refetch();
    } catch (error) {
      console.error('Error updating patient:', error);
    }
  };

  // Handle deleting a patient
  const handleDeletePatient = async (patientId: string) => {
    if (!patientId) return;

    try {
      // Delete the patient
      await deletePatient.mutate(patientId);
      refetch();
    } catch (error) {
      console.error('Error deleting patient:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {t('examples.offlineData.title')}
          </h2>
          <NetworkStatusIndicator showDetails />
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">
            {t('examples.offlineData.createPatient')}
          </h3>
          <form onSubmit={handleCreatePatient} className="flex gap-2">
            <input
              type="text"
              value={newPatientName}
              onChange={(e) => setNewPatientName(e.target.value)}
              placeholder={t('examples.offlineData.patientNamePlaceholder')}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={createPatient.loading || !newPatientName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {createPatient.loading
                ? t('common.loading')
                : t('examples.offlineData.create')}
            </button>
          </form>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">
            {t('examples.offlineData.patientsList')}
          </h3>

          {loading ? (
            <p className="text-gray-500">{t('common.loading')}</p>
          ) : error ? (
            <p className="text-red-500">{t('common.error')}: {String(error)}</p>
          ) : patients && patients.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {patients.map((patient) => (
                <li key={patient.id} className="py-4">
                  {editingPatient?.id === patient.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleSaveEdit}
                        disabled={updatePatient.loading || !editName.trim()}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                      >
                        {updatePatient.loading
                          ? t('saving')
                          : t('save')}
                      </button>
                      <button
                        onClick={() => setEditingPatient(null)}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium">
                        {formatPatientName(patient)}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStartEdit(patient)}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          {t('edit')}
                        </button>
                        <button
                          onClick={() => handleDeletePatient(patient.id!)}
                          disabled={deletePatient.loading}
                          className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                          {deletePatient.loading
                            ? t('deleting')
                            : t('delete')}
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">
              {t('examples.offlineData.noPatients')}
            </p>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-md">
          <h3 className="text-lg font-semibold mb-2">
            {t('examples.offlineData.howItWorks')}
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>{t('examples.offlineData.step1')}</li>
            <li>{t('examples.offlineData.step2')}</li>
            <li>{t('examples.offlineData.step3')}</li>
            <li>{t('examples.offlineData.step4')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OfflineDataExample;
