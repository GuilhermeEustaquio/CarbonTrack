import { Card } from '../components/ui';

const integrantes = [
  {
    nome: 'Guilherme Eustaquio',
    rm: '566784',
    turma: '1TDSPS',
    foto: '/images/equipe/guilherme.jpg', // coloque a imagem em public/images/equipe/guilherme.jpg
    github: 'https://github.com/GuilhermeEustaquio', // troque se necessário
    linkedin: 'https://www.linkedin.com/in/SEU-LINKEDIN-AQUI', // coloque seu LinkedIn aqui
  },
  {
    nome: 'Caio Cantini Couto',
    rm: '563452',
    turma: '1TDSPS',
    foto: '/images/equipe/caio.jpg', // coloque a imagem em public/images/equipe/caio.jpg
    github: 'https://github.com/USUARIO-DO-CAIO', // coloque o GitHub do Caio aqui
    linkedin: 'https://www.linkedin.com/in/LINKEDIN-DO-CAIO', // coloque o LinkedIn do Caio aqui
  },
  {
    nome: 'Matheus Tavares',
    rm: '566844',
    turma: '1TDSPS',
    foto: '/images/equipe/matheus.jpg', // coloque a imagem em public/images/equipe/matheus.jpg
    github: 'https://github.com/USUARIO-DO-MATHEUS', // coloque o GitHub do Matheus aqui
    linkedin: 'https://www.linkedin.com/in/LINKEDIN-DO-MATHEUS', // coloque o LinkedIn do Matheus aqui
  },
];

export function Integrantes() {
  return (
    <div className="view-enter">
      <div className="page-head">
        <div>
          <div className="eyebrow">Equipe</div>

          <h1>Integrantes</h1>

          <div className="sub">
            Equipe responsável pelo desenvolvimento do CarbonTrack para a Global
            Solution 2026/1.
          </div>
        </div>
      </div>

      <div className="grid-2 info-grid">
        {integrantes.map((integrante) => (
          <Card
            key={integrante.rm}
            title={integrante.nome}
            icon="user"
            sub={`RM ${integrante.rm} · ${integrante.turma}`}
          >
            <div className="cell-co" style={{ alignItems: 'flex-start' }}>
              <img
                src={integrante.foto}
                alt={`Foto de ${integrante.nome}`}
                style={{
                  width: 72,
                  height: 72,
                  flexBasis: 72,
                  borderRadius: '18px',
                  objectFit: 'cover',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                }}
              />

              <div>
                <p className="t-muted" style={{ margin: '0 0 6px' }}>
                  <strong>Nome:</strong> {integrante.nome}
                </p>

                <p className="t-muted" style={{ margin: '0 0 6px' }}>
                  <strong>RM:</strong> {integrante.rm}
                </p>

                <p className="t-muted" style={{ margin: '0 0 10px' }}>
                  <strong>Turma:</strong> {integrante.turma}
                </p>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <a
                    className="btn sm ghost"
                    href={integrante.github}
                    target="_blank"
                    rel="noreferrer"
                  >
                    GitHub
                  </a>

                  <a
                    className="btn sm ghost"
                    href={integrante.linkedin}
                    target="_blank"
                    rel="noreferrer"
                  >
                    LinkedIn
                  </a>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}