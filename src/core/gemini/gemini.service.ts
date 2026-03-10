import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrioridadeAlerta } from '../../modules/alerta/dto/create-alerta.dto';
import { getErrorMessage, getErrorStack, isAxiosError } from '../utils/error.utils';

interface GeminiCandidate {
  content?: { parts?: { text?: string }[] };
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private apiKey: string;
  private apiUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY', '');
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY não está definida no ficheiro .env');
    }
    this.apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
  }

  /**
   * Analisa uma anotação clínica e retorna uma prioridade (BAIXA, MEDIA, ALTA).
   * Utiliza IA Gemini com prompt especializado em saúde bubalina.
   *
   * @param textoOcorrencia O texto a ser analisado.
   * @returns A prioridade do alerta.
   * @throws ServiceUnavailableException se a IA estiver indisponível ou retornar resposta inválida.
   */
  async classificarPrioridadeOcorrencia(textoOcorrencia: string): Promise<PrioridadeAlerta> {
    this.logger.log('Chamando a API da Gemini para classificar a ocorrência', {
      module: 'GeminiService',
      method: 'classificarPrioridadeOcorrencia',
    });
    this.logger.debug(`Texto da ocorrência: ${textoOcorrencia}`, {
      module: 'GeminiService',
      method: 'classificarPrioridadeOcorrencia',
    });

    const systemInstruction = `
# CONTEXTO E PAPEL
Você é um veterinário especialista em búfalos leiteiros (Bubalus bubalis) com mais de 15 anos de experiência em medicina bubalina tropical.
Sua especialidade inclui diagnóstico clínico, doenças infecciosas, distúrbios reprodutivos e saúde de rebanho em sistemas de produção leiteira.

# TAREFA
Analise a ocorrência clínica descrita abaixo e classifique a URGÊNCIA do atendimento veterinário necessário.
Retorne EXCLUSIVAMENTE UMA palavra: BAIXA, MEDIA ou ALTA.

# CRITÉRIOS DE CLASSIFICAÇÃO

## PRIORIDADE ALTA (Intervenção Imediata - até 24h)
Situações de emergência que representam risco de morte, sofrimento intenso, risco de contágio severo ou perda econômica significativa:

### Sinais Clínicos Críticos:
- Prostração severa, decúbito prolongado, incapacidade de se levantar
- Febre alta (>40.5°C) ou hipotermia (<37°C)
- Dificuldade respiratória grave (dispneia, respiração ofegante)
- Sangramento ativo (nasal, retal, uterino, no leite)
- Convulsões, tremores musculares, incoordenação motora
- Dor abdominal intensa, timpanismo severo
- Desidratação severa (>10%), anorexia completa

### Doenças Específicas de Búfalos - ALTA:
- Tripanossomose (Trypanosoma evansi) com anemia aguda
- Mastite gangrenosa ou mastite com toxemia
- Febre aftosa, carbúnculo hemático
- Brucelose com aborto recente
- Retenção placentária >48h com sinais sistêmicos
- Prolapso uterino, distocia
- Pneumonia severa, hemoglobinúria bacilar
- Intoxicações agudas, clostridioses

### Indicadores de Gravidade:
- Queda súbita de produção (>70% em 24-48h)
- Múltiplos animais afetados simultaneamente
- Progressão rápida dos sintomas

## PRIORIDADE MÉDIA (Atenção Necessária - 2 a 7 dias)
Condições que requerem acompanhamento veterinário mas não representam emergência imediata:

### Sinais Clínicos Moderados:
- Febre moderada (39.5-40°C), mal-estar geral
- Redução moderada de apetite (comendo 30-70% do normal)
- Tosse persistente, corrimento nasal mucopurulento
- Edema localizado (úbere, membros), claudicação moderada
- Diarreia persistente sem desidratação severa
- Lesões cutâneas extensas, dermatites

### Doenças Específicas de Búfalos - MÉDIA:
- Mastite subclínica com CMT positivo
- Infestação moderada de carrapatos (>50 por animal)
- Pododermatite infecciosa, laminite crônica
- Conjuntivite, ceratoconjuntivite infecciosa
- Endometrite pós-parto, piometra inicial
- Pneumonia leve a moderada
- Verminose com perda de condição corporal
- Deficiência nutricional (cálcio, fósforo, selênio)

### Indicadores de Urgência Moderada:
- Queda de produção gradual (20-50% em 1-2 semanas)
- Sintomas persistentes por >3 dias
- Animal ainda se alimenta parcialmente

## PRIORIDADE BAIXA (Monitoramento - >7 dias)
Observações menores que podem ser acompanhadas na rotina de manejo sem urgência:

### Sinais Clínicos Leves:
- Pequenas escoriações, arranhões superficiais
- Tosse ocasional isolada (sem outros sintomas)
- Claudicação leve intermitente
- Corrimento nasal seroso claro
- Inchaço leve e localizado
- Perda leve de condição corporal (<5% do peso)

### Situações de Monitoramento - BAIXA:
- Ectoparasitas em pequeno número (<10 carrapatos)
- Pequenas lesões cutâneas isoladas
- Miíases superficiais iniciais
- Alterações leves de comportamento sem outros sinais
- Variações discretas na produção (<15%)
- Pelagem áspera, descamação leve
- Moscas causando incômodo leve

# REGRAS DE INTERPRETAÇÃO

1. **Palavras-chave modificadoras:**
   - "severo", "intenso", "agudo", "súbito", "grave" → aumentam urgência
   - "leve", "discreto", "ocasional", "inicial" → diminuem urgência
   - "crônico" sem sinais sistêmicos → geralmente MÉDIA ou BAIXA

2. **Múltiplos sintomas:**
   - Se houver ≥3 sintomas moderados → considere ALTA
   - Sintomas sistêmicos (febre + anorexia + prostração) → ALTA

3. **Contexto de produção:**
   - Búfalas em lactação com sinais graves → priorize ALTA
   - Búfalas gestantes com sinais reprodutivos → priorize ALTA
   - Animais jovens (<6 meses) com sinais respiratórios → priorize MÉDIA ou ALTA

4. **Casos limítrofes:**
   - Na dúvida entre ALTA/MÉDIA → escolha ALTA (princípio da precaução)
   - Na dúvida entre MÉDIA/BAIXA → escolha MÉDIA

# FORMATO DE RESPOSTA
Retorne APENAS uma das três palavras, em MAIÚSCULAS, sem pontuação ou explicação:
- ALTA
- MEDIA
- BAIXA

# EXEMPLOS DE CLASSIFICAÇÃO

"Animal com febre de 41°C, não se alimenta há 2 dias, deitado e com dificuldade para levantar" → ALTA
"Búfala com leite aguado, úbere quente e inchado, temperatura 39.8°C" → ALTA
"Animal com tripanossomose confirmada, anemia severa, mucosas pálidas" → ALTA

"Mastite crônica, leite com grumos, sem febre, animal se alimenta normalmente" → MEDIA
"Claudicação persistente há 5 dias, casco com fissura, animal comendo bem" → MEDIA
"Tosse frequente, corrimento nasal, temperatura 39.2°C" → MEDIA

"Arranhão superficial no flanco, sem sangramento ativo" → BAIXA
"Tosse isolada observada uma vez, sem outros sintomas" → BAIXA
"Alguns carrapatos na orelha, animal ativo e se alimentando bem" → BAIXA
    `;

    const payload = {
      contents: [
        {
          parts: [{ text: `${systemInstruction}\n\n# OCORRÊNCIA A CLASSIFICAR:\n"${textoOcorrencia}"\n\n# SUA CLASSIFICAÇÃO:` }],
        },
      ],
      generationConfig: {
        temperature: 0.1, // Baixa temperatura para respostas consistentes e determinísticas
        topK: 3, // Limita a 3 tokens mais prováveis (BAIXA, MEDIA, ALTA)
        topP: 0.8, // Nucleus sampling para evitar respostas aleatórias
        maxOutputTokens: 10, // Máximo de 10 tokens (suficiente para "ALTA")
        candidateCount: 1, // Apenas uma resposta
      },
    };

    try {
      const { data } = await firstValueFrom(this.httpService.post<GeminiResponse>(this.apiUrl, payload));

      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase();

      // Log da resposta bruta para depuração
      this.logger.debug(`Resposta bruta da IA: ${JSON.stringify(data)}`, {
        module: 'GeminiService',
        method: 'classificarPrioridadeOcorrencia',
      });
      this.logger.debug(`Texto extraído da IA: ${responseText}`, {
        module: 'GeminiService',
        method: 'classificarPrioridadeOcorrencia',
      });

      if (responseText && ['BAIXA', 'MEDIA', 'ALTA'].includes(responseText)) {
        this.logger.log(`Prioridade classificada pela IA: ${responseText}`, {
          module: 'GeminiService',
          method: 'classificarPrioridadeOcorrencia',
        });
        return responseText as PrioridadeAlerta;
      }

      this.logger.error(`Resposta da IA inválida ou vazia. Resposta recebida: "${responseText}".`, {
        module: 'GeminiService',
        method: 'classificarPrioridadeOcorrencia',
      });
      throw new ServiceUnavailableException('Serviço de IA retornou resposta inválida. Tente novamente mais tarde.');
    } catch (error: unknown) {
      // Log de erro MUITO mais detalhado
      this.logger.error(
        'Erro CRÍTICO ao chamar a API da Gemini. Verifique a chave e as configurações do projeto Google Cloud.',
        getErrorStack(error),
        {
          module: 'GeminiService',
          method: 'classificarPrioridadeOcorrencia',
        },
      );
      if (isAxiosError(error) && error.response) {
        this.logger.error('Detalhes do Erro da API: ' + JSON.stringify(error.response.data, null, 2), getErrorStack(error), {
          module: 'GeminiService',
          method: 'classificarPrioridadeOcorrencia',
        });
      } else {
        this.logger.error('Erro de Rede ou Configuração: ' + getErrorMessage(error), getErrorStack(error), {
          module: 'GeminiService',
          method: 'classificarPrioridadeOcorrencia',
        });
      }

      throw new ServiceUnavailableException('Serviço de IA temporariamente indisponível. Tente novamente mais tarde.');
    }
  }
}
