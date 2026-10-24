import {get,set} from 'idb-keyval';
import type {Game,RecordLife} from './game/model';
export async function loadGame(){try{return await get<Game>('last-lesson-save-v1');}catch{return undefined;}}
export async function saveGame(game:Game|null){try{await set('last-lesson-save-v1',game);}catch{throw Error('端末に保存できません。ブラウザのストレージ設定を確認してください。');}}
export async function records():Promise<RecordLife[]>{try{return await get<RecordLife[]>('last-lesson-records-v1')??[];}catch{return [];}}
export async function archive(game:Game){const all=await records();const id=`${game.seed}-${game.history.map(h=>h.eventId+':'+h.action).join('|')}`;if(!all.some(r=>r.id===id))await set('last-lesson-records-v1',[{id,date:new Date().toISOString(),game},...all].slice(0,100));}
