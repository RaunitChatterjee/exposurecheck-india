import test from "node:test";
import assert from "node:assert/strict";
import { CARD, CARD_LANGS, shareText, suggestCodeWord } from "./familycard.js";

test("every language has the same complete card", () => {
  for (const { id } of CARD_LANGS) {
    const c = CARD[id];
    assert.equal(c.rules.length, 5, id);
    for (const [h, d] of c.rules) assert.ok(h.length > 8 && d.length > 8, id);
    assert.ok(c.title && c.first && c.codeTitle && c.codeHelp && c.contactsTitle, id);
    for (const k of ["helpline", "website", "bank", "family", "name"]) assert.ok(c.labels[k], `${id} ${k}`);
    assert.match(c.rules[4].join(" "), /1930/, id);
    assert.match(c.rules[4].join(" "), /cybercrime\.gov\.in/, id);
  }
  assert.match(CARD.hi.title, /[ऀ-ॿ]/);
  assert.ok(!/[ऀ-ॿ]/.test(CARD.hinglish.title));
});

test("share text includes the rules, name, code word and helpline", () => {
  const t = shareText("en", { name: "Papa", codeWord: "Mango Window" });
  assert.match(t, /Papa/);
  assert.match(t, /Mango Window/);
  assert.match(t, /1930/);
  assert.equal(t.split("\n").filter((l) => /^\d\. /.test(l)).length, 5);
  assert.doesNotMatch(shareText("hi"), /undefined/);
  assert.doesNotMatch(shareText("en"), /code word:/i);
});

test("suggested code words are two words", () => {
  assert.match(suggestCodeWord(), /^[A-Z][a-z]+ [A-Z][a-z]+$/);
  assert.equal(suggestCodeWord(() => 0), "Mango Window");
  assert.equal(suggestCodeWord(() => 0.9999), "Peacock Ladder");
});
