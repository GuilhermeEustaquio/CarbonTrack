import type { RiscoAmbiental } from './common';
export interface Unidade { id:string; nome:string; empresaId:string; empresa:string; tipo:string; lat:number; lon:number; area:number; coberturaVeg:number; tempMedia:number; risco:RiscoAmbiental; emissaoMes:number; uf:string; ativo?:boolean; }
