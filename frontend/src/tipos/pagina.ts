/** Espelha o formato de `org.springframework.data.domain.Page` retornado pela API. */
export interface Pagina<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface ErroResposta {
  momento: string;
  status: number;
  erro: string;
  mensagem: string;
  detalhes: string[];
}
