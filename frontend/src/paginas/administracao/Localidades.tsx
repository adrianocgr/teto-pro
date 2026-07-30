import { useMemo, useState, type FormEvent } from 'react';
import { useToast } from '@/componentes/Toast';
import { IconeLocalidade } from '@/componentes/Icones';
import { useListaEstados, useListaCidades, useImportarMunicipios } from '@/api/localidades';

const UFS: { sigla: string; nome: string }[] = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
];

export function Localidades() {
  const { data: estados, isLoading: carregandoEstados } = useListaEstados();
  const { data: cidades } = useListaCidades();
  const importar = useImportarMunicipios();
  const { notificar } = useToast();

  const [ufEscolhida, setUfEscolhida] = useState('');

  const contagemPorEstado = useMemo(() => {
    const contagem = new Map<number, number>();
    for (const cidade of cidades ?? []) {
      contagem.set(cidade.estadoId, (contagem.get(cidade.estadoId) ?? 0) + 1);
    }
    return contagem;
  }, [cidades]);

  function aoImportar(evento: FormEvent) {
    evento.preventDefault();
    if (!ufEscolhida) return;
    importar.mutate(ufEscolhida, {
      onSuccess: (resultado) => {
        notificar(
          `${resultado.estadoNome}: ${resultado.totalImportados} município(s) importado(s)` +
            (resultado.totalJaExistentes > 0 ? `, ${resultado.totalJaExistentes} já existiam` : ''),
        );
        setUfEscolhida('');
      },
      onError: () => notificar('Não foi possível importar os municípios deste estado.', 'erro'),
    });
  }

  return (
    <div>
      <div className="cabecalho-pagina">
        <div>
          <div className="titulo-pagina">Localidades</div>
          <div className="subtitulo-pagina">
            {carregandoEstados ? 'Carregando…' : `${estados?.length ?? 0} estado(s) cadastrado(s)`}
          </div>
        </div>
      </div>

      <div className="painel" style={{ marginBottom: 16 }}>
        <div className="painel-cabecalho">
          <div>
            <div className="painel-titulo">Importar municípios do IBGE</div>
            <div className="painel-subtitulo">
              Escolha a sigla de um estado — o sistema cadastra o estado (se necessário) e todos os seus municípios
              automaticamente. Pode rodar de novo sem duplicar.
            </div>
          </div>
        </div>
        <div className="painel-corpo">
          <form onSubmit={aoImportar} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="campo" style={{ minWidth: 220 }}>
              <label>Estado (UF)</label>
              <select value={ufEscolhida} onChange={(e) => setUfEscolhida(e.target.value)}>
                <option value="">Selecione…</option>
                {UFS.map((uf) => (
                  <option key={uf.sigla} value={uf.sigla}>
                    {uf.sigla} — {uf.nome}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="botao botao-primario" disabled={!ufEscolhida || importar.isPending}>
              {importar.isPending ? 'Importando…' : 'Importar municípios'}
            </button>
          </form>
        </div>
      </div>

      <div className="painel">
        <div className="painel-corpo" style={{ padding: 0 }}>
          {carregandoEstados ? (
            <div className="estado-vazio">
              <div className="titulo">Carregando…</div>
            </div>
          ) : (estados ?? []).length === 0 ? (
            <div className="estado-vazio">
              <IconeLocalidade width={28} height={28} />
              <div className="titulo">Nenhum estado cadastrado</div>
              <div className="subtitulo">Importe municípios de um estado para começar.</div>
            </div>
          ) : (
            <div className="tabela-scroll">
              <table className="dados">
                <thead>
                  <tr>
                    <th>UF</th>
                    <th>Estado</th>
                    <th className="num">Municípios cadastrados</th>
                  </tr>
                </thead>
                <tbody>
                  {(estados ?? [])
                    .slice()
                    .sort((a, b) => a.nome.localeCompare(b.nome))
                    .map((estado) => (
                      <tr key={estado.id}>
                        <td>{estado.sigla}</td>
                        <td>{estado.nome}</td>
                        <td className="num">{contagemPorEstado.get(estado.id) ?? 0}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
