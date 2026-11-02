# Coding-agent sessions

What the Cursor agent did on this project, with its own transcript and files. Nothing here is reconstructed: the transcript is Cursor's export, unedited, and the scripts are the files the agent wrote while it worked.

## Sessions A and B: schema discovery and the four-source query

|            |                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------ |
| Tool       | Cursor 3.27.22, agent mode                                                                       |
| Model      | `grok-4.7`, high reasoning effort, fast, 256k context (from Cursor's local record of the chat)   |
| When       | 2026-11-02, about 00:20 to 00:54 UTC (from the agent's working files and the chat's last update) |
| Who ran it | The developer, in the Cursor app                                                                 |
| Transcript | [session-ab/transcript.md](session-ab/transcript.md)                                             |

**Session A.** The agent built a Python environment under `/tmp` with JayDeBeApi and connected to Zetaris over the Lightning JDBC driver. Its helper, [zetaris_jdbc.py](session-ab/zetaris_jdbc.py), reads the credentials from the platform's `.env` file at run time and never prints them. It ran `SELECT 1`, then `DESCRIBE` and a `LIMIT 1` probe on `FDA_RAW.recalls` and `FDA_RAW.shortages_p00` ([describe_recalls.json](session-ab/describe_recalls.json), [describe_shortages.json](session-ab/describe_shortages.json)). It found each REST table exposed as two columns, `meta` and `results`, with `results` an array of structs; it checked that `openfda.product_ndc` is `array<string>` on recalls and that shortages carry a top-level `package_ndc` string, and that every NDC matched the patterns the views use. The view SQL already matched the live shape, so it changed nothing and created the views with [run_views.py](session-ab/run_views.py): `fda.recalls_by_ndc` with 624 rows and `fda.shortages_by_ndc` with 1,615.

**Session B.** It ran [sql/named/alerts_master.sql](../../sql/named/alerts_master.sql) unchanged over the same connection with [run_alerts.py](session-ab/run_alerts.py). The statement returned 15 rows and 15 unique `recall_number:dispense_id` keys, which it listed, and the repository's full gate passed (117 tests at that commit).

**What changed in the repository:** nothing. Both prompts allowed the agent to fix the SQL only where the live schema required it, and it did not.

**How the result was checked:** its 15 keys are saved in [../jdbc-case-ids.json](../jdbc-case-ids.json). Check V-07 compares them with the API's own run of the same query over the Zetaris REST interface: identical ([../verification.json](../verification.json)).

## Other tools

Most of this repository was written with Claude Code (Anthropic), including the prompts the developer pasted into Cursor above. Those sessions are not presented as Cursor or Grok work.
