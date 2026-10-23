import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createOwnerSession,validOwnerSession,passwordMatches} from '../lib/owner-session.ts';
const secret='test-only-password-long-enough-123';
test('owner cookie accepts a valid signature and rejects tampering',async()=>{const token=await createOwnerSession(secret,100000);assert.equal(await validOwnerSession(token,secret,100001),true);const parts=token.split('.');parts[0]=parts[0].slice(0,-3)+'abc';assert.equal(await validOwnerSession(parts.join('.'),secret,100001),false);});
test('sessions expire and a password change invalidates them',async()=>{const token=await createOwnerSession(secret,100000);assert.equal(await validOwnerSession(token,secret,100000+8*60*60*1000),false);assert.equal(await validOwnerSession(token,secret+'changed',100001),false);assert.equal(await validOwnerSession('broken',secret),false);assert.equal(await validOwnerSession(token,'short',100001),false);});
test('password verification rejects incorrect inputs',async()=>{assert.equal(await passwordMatches(secret,secret),true);assert.equal(await passwordMatches('wrong',secret),false);});
