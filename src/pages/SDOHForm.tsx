// Cuestionario SDOH (determinantes sociales de la salud) del paciente.
// El Questionnaire vive en el BackEnd; acá se busca por su URL canónica y se
// renderiza con el QuestionnaireForm del SDK de Medplum.
import { Paper, Stack, Text, Title } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { normalizeErrorString } from '@medplum/core';
import type { QuestionnaireResponse } from '@medplum/fhirtypes';
import { Document, Loading, QuestionnaireForm, useMedplum, useSearchOne } from '@medplum/react';
import type { JSX } from 'react';
import { useNavigate, useParams } from 'react-router';
import { SDOH_QUESTIONNAIRE_URL } from '../ckm/constants';

export function SDOHForm(): JSX.Element {
  const medplum = useMedplum();
  const navigate = useNavigate();
  const { patientId } = useParams();
  const [questionnaire, loading] = useSearchOne('Questionnaire', { url: SDOH_QUESTIONNAIRE_URL });

  if (loading) {
    return <Loading />;
  }

  if (!questionnaire) {
    return (
      <Document>
        <Text c="dimmed">
          No se encontró el cuestionario SDOH en el servidor (URL canónica {SDOH_QUESTIONNAIRE_URL}). Verificá que esté
          cargado en el proyecto.
        </Text>
      </Document>
    );
  }

  function handleSubmit(response: QuestionnaireResponse): void {
    medplum
      .createResource<QuestionnaireResponse>({
        ...response,
        status: 'completed',
        questionnaire: SDOH_QUESTIONNAIRE_URL,
        subject: { reference: `Patient/${patientId}` },
        authored: new Date().toISOString(),
      })
      .then(() => {
        showNotification({ color: 'green', message: 'Cuestionario SDOH enviado' });
        navigate(`/Patient/${patientId}`)?.catch(console.error);
      })
      .catch((err) => showNotification({ color: 'red', message: normalizeErrorString(err) }));
  }

  return (
    <Paper shadow="xs" m="md" p="md" maw={800} mx="auto">
      <Stack gap="sm">
        <Title order={3}>{questionnaire.title ?? 'Cuestionario SDOH'}</Title>
        <QuestionnaireForm
          questionnaire={questionnaire}
          subject={{ reference: `Patient/${patientId}` }}
          submitButtonText="Enviar"
          onSubmit={handleSubmit}
        />
      </Stack>
    </Paper>
  );
}
