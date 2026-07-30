import type { InputHTMLAttributes } from 'react';
import { mascararCpfCnpj, mascararTelefone, valorMonetarioParaDecimal } from '@/utilitarios/mascaras';
import { formatarMoeda } from '@/utilitarios/formatacao';

type PropsBase = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>;

interface PropsTexto extends PropsBase {
  valor: string;
  onValorAlterado: (valor: string) => void;
}

/** Igual ao CPF, mas detecta CNPJ automaticamente conforme a quantidade de dígitos digitados. */
export function CampoCpfCnpj({ valor, onValorAlterado, ...resto }: PropsTexto) {
  return (
    <input
      {...resto}
      type="text"
      inputMode="numeric"
      value={valor}
      onChange={(e) => onValorAlterado(mascararCpfCnpj(e.target.value))}
    />
  );
}

export function CampoTelefone({ valor, onValorAlterado, ...resto }: PropsTexto) {
  return (
    <input
      {...resto}
      type="text"
      inputMode="numeric"
      value={valor}
      onChange={(e) => onValorAlterado(mascararTelefone(e.target.value))}
    />
  );
}

/**
 * Campo de valor em reais: exibe formatado ("R$ 1.234,56") enquanto a pessoa
 * digita, mas o valor reportado via `onValorAlterado` é sempre uma string
 * decimal simples (ex.: "1234.56"), pronta pra `Number(...)` na hora de
 * montar o payload — mesmo contrato que os campos numéricos que substitui.
 */
export function CampoValorMonetario({ valor, onValorAlterado, ...resto }: PropsTexto) {
  const exibicao = valor === '' || valor === null || valor === undefined ? '' : formatarMoeda(valor);
  return (
    <input
      {...resto}
      type="text"
      inputMode="numeric"
      placeholder={resto.placeholder ?? 'R$ 0,00'}
      value={exibicao}
      onChange={(e) => onValorAlterado(valorMonetarioParaDecimal(e.target.value))}
    />
  );
}
