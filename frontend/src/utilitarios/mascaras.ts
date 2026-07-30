export function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

export function mascararTelefone(valor: string): string {
  const digitos = apenasDigitos(valor).slice(0, 11);
  if (digitos.length <= 2) return digitos.replace(/^(\d*)/, '($1');
  if (digitos.length <= 6) return digitos.replace(/^(\d{2})(\d*)/, '($1) $2');
  if (digitos.length <= 10) return digitos.replace(/^(\d{2})(\d{4})(\d*)/, '($1) $2-$3');
  return digitos.replace(/^(\d{2})(\d{5})(\d*)/, '($1) $2-$3');
}

export function mascararCpf(valor: string): string {
  const digitos = apenasDigitos(valor).slice(0, 11);
  return digitos
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
}

export function mascararCnpj(valor: string): string {
  const digitos = apenasDigitos(valor).slice(0, 14);
  return digitos
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

/** Detecta CPF (até 11 dígitos) ou CNPJ (12+) conforme a pessoa digita. */
export function mascararCpfCnpj(valor: string): string {
  const digitos = apenasDigitos(valor);
  return digitos.length > 11 ? mascararCnpj(valor) : mascararCpf(valor);
}

/**
 * Converte o texto digitado num campo de valor monetário (os dígitos são
 * tratados como centavos, ex.: digitar "12345" vira R$ 123,45) para uma
 * string decimal pronta pra API (ex.: "123.45"). Retorna '' se não há dígitos.
 */
export function valorMonetarioParaDecimal(valorDigitado: string): string {
  const digitos = apenasDigitos(valorDigitado);
  if (!digitos) return '';
  return (Number(digitos) / 100).toFixed(2);
}
