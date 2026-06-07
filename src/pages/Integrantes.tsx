import { Card } from '../components/ui';

const integrantes = [
  {
    nome: 'Guilherme Eustaquio',
    rm: '566784',
    turma: '1TDSPS',
    github: 'https://github.com/guilhermeeustaquio',
    linkedin: 'https://linkedin.com/in/guilhermeeustaquio',
    foto: 'https://github.com/guilhermeeustaquio.png',
  },
  {
    nome: 'Caio Cantini Couto',
    rm: '563452',
    turma: '1TDSPS',
    github: 'https://github.com/caioccouto',
    linkedin: 'https://www.linkedin.com/in/caio-couto-44b849326/',
    foto: 'https://github.com/caioccouto.png',
  },
  {
    nome: 'Matheus Tavares',
    rm: '566844',
    turma: '1TDSPS',
    github: 'https://github.com/manovares',
    linkedin: 'https://www.linkedin.com/in/manovares',
    foto: 'https://github.com/manovares.png',
  },
];

function getGithubHandle(url: string) {
  return '@' + url.replace(/https?:\/\/(www\.)?github\.com\//, '').replace(/\/$/, '');
}

function getLinkedinHandle(url: string) {
  return url.replace(/https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '');
}

function Avatar({ nome, foto }: { nome: string; foto: string | null }) {
  const initials = nome
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('');

  if (foto) {
    return (
      <img
        src={foto}
        alt={`Foto de ${nome}`}
        style={{
          width: 64,
          height: 64,
          flexBasis: 64,
          flexShrink: 0,
          borderRadius: '50%',
          objectFit: 'cover',
        }}
        onError={(e) => {
          const img = e.currentTarget;
          const fallback = img.nextElementSibling as HTMLElement | null;
          img.style.display = 'none';
          if (fallback) fallback.style.display = 'flex';
        }}
      />
    );
  }

  return (
    <div
      className="logo"
      style={{ width: 64, height: 64, flexBasis: 64, flexShrink: 0 }}
    >
      {initials}
    </div>
  );
}

export function Integrantes() {
  return (
    <div className="view-enter">
      <div className="page-head">
        <div>
          <div className="eyebrow">Equipe</div>
          <h1>Integrantes</h1>
          <div className="sub">
            Conheça os integrantes do grupo e acesse seus perfis.
          </div>
        </div>
      </div>

      <div className="grid-2 info-grid">
        {integrantes.map((i) => (
          <Card
            key={i.rm}
            title={i.nome}
            icon="user"
            sub={`RM ${i.rm} · ${i.turma}`}
          >
            <div className="cell-co" style={{ alignItems: 'flex-start' }}>
              <Avatar nome={i.nome} foto={i.foto} />

              <div>
                <p className="t-muted" style={{ margin: '0 0 6px' }}>
                  GitHub:{' '}
                  <a href={i.github} target="_blank" rel="noreferrer">
                    {getGithubHandle(i.github)}
                  </a>
                </p>

                <p className="t-muted" style={{ margin: 0 }}>
                  LinkedIn:{' '}
                  <a href={i.linkedin} target="_blank" rel="noreferrer">
                    {getLinkedinHandle(i.linkedin)}
                  </a>
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}