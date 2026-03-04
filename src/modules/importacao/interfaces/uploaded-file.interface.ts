/**
 * Interface para tipagem de arquivos enviados via Multer (memória).
 *
 * Substitui o uso de `any` para o parâmetro de arquivos
 * recebidos pelo `@UploadedFile()` no NestJS com `FileInterceptor`.
 *
 * @see https://github.com/expressjs/multer#file-information
 */
export interface UploadedFileInterface {
  /** Nome do campo no formulário */
  fieldname: string;

  /** Nome original do arquivo enviado pelo cliente */
  originalname: string;

  /** Encoding do arquivo (ex: '7bit') */
  encoding: string;

  /** MIME type do arquivo (ex: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') */
  mimetype: string;

  /** Buffer com o conteúdo binário do arquivo (presente apenas com memoryStorage) */
  buffer?: Buffer;

  /** Caminho completo do arquivo salvo em disco (diskStorage) */
  path: string;

  /** Nome do arquivo gerado pelo diskStorage */
  filename: string;

  /** Diretório de destino do diskStorage */
  destination: string;

  /** Tamanho do arquivo em bytes */
  size: number;
}
