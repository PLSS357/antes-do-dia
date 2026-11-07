import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAnswer, verifyAnswer, caesar, verifySequence, canAccessChapter } from '../lib/puzzle-engine.js';
import { hashPassword, checkPassword, createSessionToken, hashSessionToken } from '../lib/authentication.js';

test('respostas toleram acentos, caixa e espaçamento, sem aceitar vazio', () => {
  assert.equal(normalizeAnswer('  Uma árvore   azul! '), 'UMA ARVORE AZUL');
  assert.ok(verifyAnswer('árvore', ['ARVORE']));
  assert.ok(!verifyAnswer('arvoredo', ['ARVORE']));
  assert.ok(!verifyAnswer('', ['']));
  assert.ok(!verifyAnswer(null, ['ARVORE']));
});

test('César é reversível, mantém separadores e circula pelo alfabeto', () => {
  assert.equal(caesar('XYZ xyz', 3), 'ABC abc');
  const plain = 'MENSAGEM DE EXEMPLO';
  assert.equal(caesar(caesar(plain, 3), -3), plain);
});

test('reconstrução exige ordem, completude e ausência de duplicatas extras', () => {
  assert.ok(verifySequence(['a', 'b', 'c'], ['a', 'b', 'c']));
  assert.ok(!verifySequence(['b', 'a', 'c'], ['a', 'b', 'c']));
  assert.ok(!verifySequence(['a', 'b'], ['a', 'b', 'c']));
});

test('bloqueio narrativo não é contornado por progresso ou preview público', () => {
  const state = { chapter: 8, released: [1, 2, 3, 4, 5, 6, 7], solved: [1, 2, 3, 4, 5, 6, 7] };
  assert.ok(!canAccessChapter(state));
  assert.ok(!canAccessChapter({ ...state, preview: true }));
  assert.ok(canAccessChapter({ ...state, preview: true, isMaster: true }));
  assert.ok(canAccessChapter({ ...state, released: [...state.released, 8] }));
  assert.ok(!canAccessChapter({ ...state, chapter: 9 }));
  assert.ok(!canAccessChapter({ chapter: 4, released: [4], solved: [] }));
});

test('senhas possuem salt, comparação segura e rejeição de hash inválido', () => {
  const password = 'teste-local-sem-credencial-real';
  const first = hashPassword(password);
  assert.notEqual(first, hashPassword(password));
  assert.ok(checkPassword(password, first));
  assert.ok(!checkPassword('incorreta', first));
  assert.ok(!checkPassword(password, 'scrypt:invalid:invalid'));
  assert.throws(() => hashPassword('curta'));
  const token = createSessionToken();
  assert.notEqual(token, createSessionToken());
  assert.equal(hashSessionToken(token).length, 64);
});
