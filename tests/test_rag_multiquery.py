"""Multi-query retrieval helpers (rag/multiquery.py): query decomposition parsing, the collection router and the merge
of per-query reranked lists into the final top k. No model is loaded here; the LLM that writes sub-queries runs
outside the retriever (the RAG-only Kaggle rule), and these functions only shape its output and the ranked lists."""
import pytest

from rag.multiquery import (DECOMPOSE_PROMPT, merge_multi_query, merge_collections, parse_subqueries,
                            route_collections)


# ------------------------------------------------------------------ decomposition output
def test_decompose_prompt_formats_and_asks_for_json():
    s = DECOMPOSE_PROMPT.format(question="Is there a separate wedding limit, and how long can I repay?", history="")
    assert "JSON" in s and "queries" in s and "English" in s


@pytest.mark.parametrize("raw,orig,want", [
    ('{"queries": ["wedding loan maximum amount", "personal loan repayment tenure"]}', "q",
     ["wedding loan maximum amount", "personal loan repayment tenure"]),
    ('```json\n{"queries": ["a b c"]}\n```', "q", ["a b c"]),
    ('{"queries": []}', "q", []),
    ("not json", "q", []),
    ('{"queries": "x"}', "q", []),
    # duplicates of the original or of each other, empties and over-long lists are dropped / capped
    ('{"queries": ["Q", " q ", "", "one", "One", "two", "three", "four"]}', "q", ["one", "two", "three"]),
])
def test_parse_subqueries(raw, orig, want):
    assert parse_subqueries(raw, orig, max_queries=3) == want


# ------------------------------------------------------------------ collection router
@pytest.mark.parametrize("q,pref", [
    ("What does the RBI say about the cooling-off period for digital loans?", "rbi_regulatory"),
    ("How do I escalate to the RBI Ombudsman if the lender does not reply?", "rbi_regulatory"),
    ("What is the processing fee on a Bajaj personal loan?", "saral_nbfc_policy"),
    ("Can I use a personal loan for my wedding?", "saral_nbfc_policy"),
])
def test_router_prefers_the_matching_collection(q, pref):
    w = route_collections(q)
    other = "saral_nbfc_policy" if pref == "rbi_regulatory" else "rbi_regulatory"
    assert w[pref] == 1.0 and w[other] < 1.0


def test_router_is_neutral_when_both_or_neither_match():
    assert route_collections("What is a personal loan?") == {"saral_nbfc_policy": 1.0, "rbi_regulatory": 1.0}
    both = route_collections("Does RBI let Bajaj charge a foreclosure fee?")
    assert both == {"saral_nbfc_policy": 1.0, "rbi_regulatory": 1.0}


def test_merge_collections_applies_router_weights_and_sorts():
    per = {"saral_nbfc_policy": [("N1", 0.9), ("N2", 0.5)], "rbi_regulatory": [("R1", 0.8), ("R2", 0.1)]}
    assert [c for c, _ in merge_collections(per)] == ["N1", "R1", "N2", "R2"]
    got = merge_collections(per, {"saral_nbfc_policy": 1.0, "rbi_regulatory": 0.5})
    assert [c for c, _ in got] == ["N1", "N2", "R1", "R2"]


# ------------------------------------------------------------------ merge of per-query lists
def test_single_query_is_unchanged_top_k():
    ranked = [[("A", 0.9), ("B", 0.8), ("C", 0.7), ("D", 0.6), ("E", 0.5), ("F", 0.4)]]
    assert [c for c, _ in merge_multi_query(ranked, k=5)] == ["A", "B", "C", "D", "E"]


def test_every_sub_query_gets_a_slot_and_duplicates_are_skipped():
    orig = [("A", 0.9), ("B", 0.8), ("C", 0.7), ("D", 0.6), ("E", 0.5)]
    sub1 = [("A", 0.95), ("X", 0.9), ("Y", 0.2)]
    sub2 = [("Z", 0.7), ("B", 0.6)]
    got = [c for c, _ in merge_multi_query([orig, sub1, sub2], k=5, original_first=2)]
    assert got[:2] == ["A", "B"]          # the original question keeps its top hits first
    assert "X" in got and "Z" in got      # each sub-query contributes its best new chunk
    assert len(got) == len(set(got)) == 5


def test_low_scoring_sub_query_hits_do_not_displace_the_original():
    orig = [("A", 0.9), ("B", 0.8), ("C", 0.7), ("D", 0.6), ("E", 0.5)]
    junk = [("J1", 0.001), ("J2", 0.0005)]
    assert [c for c, _ in merge_multi_query([orig, junk], k=5, min_score=0.01)] == ["A", "B", "C", "D", "E"]


def test_merge_keeps_the_best_score_seen_for_a_chunk():
    got = dict(merge_multi_query([[("A", 0.2)], [("A", 0.9)]], k=5))
    assert got == {"A": 0.9}
