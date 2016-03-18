//part-of-speech tagging
'use strict';
const word_rules = require('./word_rules');
const grammar_pass = require('./grammar_pass');
const lumper = require('./lumper');
const fancy_lumping = require('./fancy_lumping');
const phrasal_verbs = require('./phrasal_verbs');
const interjection_fixes = require('./interjection_fixes');
const lexicon_pass = require('./lexicon_pass');
const capital_signals = require('./capital_signals');
const pos = require('./parts_of_speech');
const assign = require('./assign');

//regex hints for words/suffixes
const word_rules_pass = function(terms) {
  for (let i = 0; i < terms.length; i++) {
    if (terms[i].tag !== '?') {
      continue;
    }
    for (let o = 0; o < word_rules.length; o++) {
      if (terms[i].text.length > 3 && terms[i].normal.match(word_rules[o].reg)) {
        terms[i] = assign(terms[i], word_rules[o].pos, 'rules_pass_' + o);
        break;
      }
    }
  }
  return terms;
};

const noun_fallback = function(terms) {
  for(let i = 0; i < terms.length; i++) {
    if (terms[i].tag === '?' && terms[i].normal.match(/[a-z]/)) {
      terms[i] = assign(terms[i], 'Noun', 'fallback');
    }
  }
  return terms;
};

//turn nouns into person/place
const specific_pos = function(terms) {
  for(let i = 0; i < terms.length; i++) {
    let t = terms[i];
    if (t instanceof pos.Noun) {
      if (t.is_person()) {
        terms[i] = assign(t, 'Person', 'is_person');
      } else if (t.is_place()) {
        terms[i] = assign(t, 'Place', 'is_place');
      } else if (t.is_value()) {
        terms[i] = assign(t, 'Value', 'is_value');
      } else if (t.is_date()) {
        terms[i] = assign(t, 'Date', 'is_date');
      } else if (t.is_organization()) {
        terms[i] = assign(t, 'Organization', 'is_organization');
      }
    }
  }
  return terms;
};

const tagger = function(s, options) {
  //word-level rules
  s.terms = capital_signals(s.terms);
  s.terms = lexicon_pass(s.terms, options);
  s.terms = word_rules_pass(s.terms);
  s.terms = interjection_fixes(s.terms);
  //repeat these steps a couple times, to wiggle-out the grammar
  for(let i = 0; i < 2; i++) {
    s.terms = grammar_pass(s);
    s.terms = lumper(s.terms);
    s.terms = noun_fallback(s.terms);
    s.terms = phrasal_verbs(s.terms);
    s.terms = specific_pos(s.terms);
    s.terms = fancy_lumping(s.terms);
  }
  return s.terms;
};

module.exports = tagger;
