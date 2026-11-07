import { hashPassword } from '../lib/authentication.js';
import { database, setting, setSetting } from '../lib/database.js';
import { createInterface } from 'node:readline';
database();
if(!process.stdin.isTTY) {
  let input=''; for await(const chunk of process.stdin){input+=chunk;if(input.length>2048)throw new Error('Entrada excessiva.');}
  const password=input.trimEnd(); setSetting('master-password',hashPassword(password));
  console.log('Senha do mestre cadastrada. Credenciais não foram exibidas.');
} else {
  console.log(setting('master-password')?'Este procedimento substituirá a senha administrativa.':'Cadastro local do mestre. Use pelo menos 14 caracteres.');
  const readline=createInterface({input:process.stdin,output:process.stdout,terminal:true});
  // Suppress terminal echo while reading the secret.
  process.stdout.write('Nova senha (oculta): ');
  readline._writeToOutput=()=>{};
  const password=await new Promise(resolve=>readline.question('',resolve));
  process.stdout.write('\nRepita a senha: ');
  const confirmation=await new Promise(resolve=>readline.question('',resolve));
  readline.close();process.stdout.write('\n');
  if(password!==confirmation)throw new Error('As senhas não coincidem.');
  setSetting('master-password',hashPassword(password));
  console.log('Senha cadastrada; sessões administrativas anteriores foram encerradas.');
}
database().prepare("DELETE FROM sessions WHERE role='master'").run();
