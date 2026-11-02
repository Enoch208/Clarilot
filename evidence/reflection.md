# Builder's reflection

The developer recorded this on a phone on 2 November 2026, in one 70-second take, in the developer's own words. The demo video uses 51.75 seconds of it, in three continuous pieces. The transcript was made with Whisper (`small.en`). The only corrections are product names and one phrase Whisper heard as "at the table", written here as "as a table".

## In the video

> Before Zetaris, the plan was basically an ETL job. Pull the FDA data every night, clean up the JSON, and dump it into Postgres. But then, actually, watch Cursor agents hook up into Zetaris and run one query, just one query. So, the pharmacy database, the FDA feeds, the CSV file, all in one go. And actually, what happened? Fifteen cases actually came back, and there was no pipeline. And honestly, the craziest part is that the FDA API actually shows up just as a table.
>
> And that new record that we added to Postgres, we just tried to run it again, and what we noticed is that we saw sixteen.
>
> And right now, another thing I noticed when I did the benchmark was that it was not instant. It actually took seven seconds on my laptop. But now I ask the question first, and I only build a pipeline if I actually need one. Thanks to Zetaris.

## Cut for length

| Recording time | Words                                                                                                                                                                               | Why it was cut                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 32.8–36.5 s    | "and then we added one more [unclear] to Postgres."                                                                                                                                 | The next sentence says the same thing                             |
| 43.4–53.6 s    | "And this is actually very interesting, because [unclear] didn't actually restart anything. I didn't [unclear] anything again. Everything was just on the [unclear] Cursor agents." | Several words could not be transcribed reliably enough to caption |
| 67.6 s to end  | "Well, well, well."                                                                                                                                                                 | After the closing line                                            |

## What the reflection refers to

- **Fifteen cases from one query:** [sql/named/alerts_master.sql](../sql/named/alerts_master.sql), run unchanged by the Cursor agent over JDBC ([agent/README.md](agent/README.md), session B) and by the app.
- **The FDA API as a table:** the `DESCRIBE` output in [agent/session-ab](agent/session-ab).
- **Sixteen after one Postgres insert:** the insert test in [source-parity.md](source-parity.md).
- **Seven seconds:** the measured query times, median 7.6 s over 4 runs, in [source-parity.md](source-parity.md).
