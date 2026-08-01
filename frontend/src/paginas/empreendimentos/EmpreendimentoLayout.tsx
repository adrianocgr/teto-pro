import { useEffect, useRef } from 'react';
import { Link, matchPath, Outlet, useLocation, useParams } from 'react-router-dom';
import { useEmpreendimento } from '@/api/empreendimentos';
import { useDefinirEmpreendimentoAtual } from '@/componentes/ContextoEmpreendimentoAtual';
import { IconeSeta } from '@/componentes/Icones';

export function EmpreendimentoLayout() {
  const { id } = useParams<{ id: string }>();
  const empreendimentoId = Number(id);
  const { data: empreendimento, isLoading, isError } = useEmpreendimento(empreendimentoId);
  const location = useLocation();
  const cabecalhoRef = useRef<HTMLDivElement>(null);

  useDefinirEmpreendimentoAtual(empreendimento?.id, empreendimento?.descricao);

  // Na tela de cadastro/edição de despesa (o formulário mais longo do
  // sistema), o cabeçalho do empreendimento fica fixo junto com os botões de
  // ação da despesa (ver DespesaDetalhe.tsx) — assim o usuário nunca perde de
  // vista onde está nem os botões de Salvar/Cancelar ao rolar a tela. A
  // altura real deste cabeçalho é publicada numa custom property porque o
  // cabeçalho da despesa (num componente separado) precisa saber onde "grudar"
  // logo abaixo dele.
  const naTelaDespesaDetalhe = !!matchPath('/empreendimentos/:id/despesas/:despesaId', location.pathname);

  useEffect(() => {
    const elemento = cabecalhoRef.current;
    if (!naTelaDespesaDetalhe || !elemento) return;

    const atualizarAltura = () => {
      document.documentElement.style.setProperty('--altura-cabecalho-empreendimento', `${elemento.offsetHeight}px`);
    };
    atualizarAltura();

    const observador = new ResizeObserver(atualizarAltura);
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [naTelaDespesaDetalhe, empreendimento]);

  if (isLoading) {
    return <p>Carregando…</p>;
  }

  if (isError || !empreendimento) {
    return (
      <div>
        <Link to="/empreendimentos" className="link-voltar">
          <IconeSeta /> Voltar para empreendimentos
        </Link>
        <div className="estado-vazio">
          <div className="titulo">Empreendimento não encontrado</div>
          <div className="subtitulo">Verifique se o link está correto ou volte para a lista.</div>
        </div>
      </div>
    );
  }

  const rotuloPartes = [
    empreendimento.matricula ? `Matrícula ${empreendimento.matricula}` : null,
    empreendimento.inscricaoMunicipal ? `IM ${empreendimento.inscricaoMunicipal}` : null,
  ].filter(Boolean);

  const enderecoPartes = [
    [empreendimento.endereco, empreendimento.numero].filter(Boolean).join(', '),
    empreendimento.complemento,
    empreendimento.quadra ? `Quadra ${empreendimento.quadra}` : null,
    empreendimento.lote ? `Lote ${empreendimento.lote}` : null,
  ].filter(Boolean);

  return (
    <div>
      <Link to="/empreendimentos" className="link-voltar">
        <IconeSeta /> Voltar para empreendimentos
      </Link>

      <div
        ref={cabecalhoRef}
        className={`cabecalho-pagina${naTelaDespesaDetalhe ? ' cabecalho-fixo' : ''}`}
      >
        <div>
          {rotuloPartes.length > 0 && <div className="rotulo">{rotuloPartes.join(' · ')}</div>}
          <h1 className="titulo-pagina">{empreendimento.descricao}</h1>
          {enderecoPartes.length > 0 && <p className="subtitulo-pagina">{enderecoPartes.join(' · ')}</p>}
        </div>
      </div>

      <Outlet />
    </div>
  );
}
