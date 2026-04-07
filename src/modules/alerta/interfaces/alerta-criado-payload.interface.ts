/**
 * Payload emitido pelo AlertasService quando um alerta é criado.
 */
export interface AlertaCriadoPayload {
  id_alerta: string;
  nicho: string;
  prioridade?: string | null;
  titulo: string;
  descricao?: string | null;
  texto_ocorrencia_clinica?: string | null;
  data_ocorrencia: string;
  animal_id?: string | null;
  id_propriedade?: string | null;
  grupo?: string | null;
}
