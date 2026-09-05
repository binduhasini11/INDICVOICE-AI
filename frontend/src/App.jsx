import { useState } from "react";

import VoiceButton from "./components/VoiceButton";
import Transcript from "./components/Transcript";
import IntentCard from "./components/IntentCard";
import SearchStatus from "./components/SearchStatus";
import ResultCard from "./components/ResultCard";
import ChatMessage from "./components/ChatMessage";

import { searchTravel } from "./api";

import "./App.css";


function App() {
  const [transcript, setTranscript] = useState("");

  const [intent, setIntent] = useState(null);

  const [status, setStatus] = useState("");

  const [results, setResults] = useState([]);

  const [response, setResponse] = useState("");

  const [error, setError] = useState("");


  const processRequest = async (text) => {
    setTranscript(text);

    setResults([]);
    setResponse("");
    setError("");

    /*
      TEMPORARY INTENT EXTRACTION

      Member 1 will replace this with
      the actual AI intent agent.
    */

    const lower = text.toLowerCase();

    let origin = "";
    let destination = "";

    if (lower.includes("chennai")) {
      origin = "Chennai";
    }

    if (
      lower.includes("bangalore") ||
      lower.includes("bengaluru")
    ) {
      destination = "Bengaluru";
    }

    const detectedIntent = {
      title: "Travel Search",
      details: [
        {
          label: "From",
          value: origin || "Detected automatically",
        },
        {
          label: "To",
          value: destination || "Detected automatically",
        },
        {
          label: "Mode",
          value: "Travel",
        },
      ],
    };

    setIntent(detectedIntent);

    if (!origin || !destination) {
      setError(
        "I understood this as a travel request, but I couldn't identify the complete route."
      );
      return;
    }

    setStatus("Searching...");

    try {
      const data = await searchTravel({
        origin,
        destination,
        time_preference: lower.includes("morning")
          ? "morning"
          : null,
        preference: lower.includes("cheap")
          ? "cheapest"
          : null,
      });

      setStatus("Search complete");

      /*
        Backend may return either:
        { results: [...] }
        or directly [...]
      */

      const travelResults = Array.isArray(data)
        ? data
        : data.results || [];

      setResults(travelResults);

      if (travelResults.length === 0) {
        setResponse(
          "I couldn't find matching options in the current travel data."
        );
      } else {
        setResponse(
          `I found ${travelResults.length} travel options. Here are the best matches:`
        );
      }

    } catch (err) {
      console.error(err);

      setStatus("");

      setError(
        "Could not connect to IndicVoice AI backend."
      );
    }
  };


  return (
    <div className="app">

      {/* HEADER */}

      <header className="header">

        <div className="brand">
          <div className="brand-icon">
            ◉
          </div>

          <div>
            <h1>IndicVoice AI</h1>

            <p>
              Voice-first search for India
            </p>
          </div>
        </div>

        <div className="status-pill">
          ● AI READY
        </div>

      </header>


      {/* HERO */}

      <main className="main">

        <section className="hero">

          <div className="eyebrow">
            SPEAK • SEARCH • DISCOVER
          </div>

          <h2>
            Search the web
            <br />
            <span>without typing.</span>
          </h2>

          <p className="hero-description">
            Ask naturally in English, Hindi,
            Tamil or code-switched speech.
          </p>


          {/* VOICE */}

          <VoiceButton
            onTranscript={processRequest}
          />


          <div className="example">
            Try saying:
            <br />

            <span>
              “Chennai la irundhu Bangalore ku
              naalaiku morning cheap-a train paathu sollu”
            </span>
          </div>

        </section>


        {/* RESULTS AREA */}

        <section className="results-section">

          <Transcript
            text={transcript}
          />


          <IntentCard
            intent={intent}
          />


          <SearchStatus
            status={status}
          />


          {error && (
            <div className="error-box">
              ⚠️ {error}
            </div>
          )}


          {response && !error && (
            <ChatMessage
              message={response}
              type="assistant"
            />
          )}


          {results.length > 0 && (

            <div className="results-list">

              <div className="results-heading">
                BEST MATCHES
              </div>

              {results.map((result, index) => (

                <ResultCard
                  key={result.id || index}
                  result={result}
                  index={index}
                />

              ))}

            </div>

          )}

        </section>

      </main>


      {/* FOOTER */}

      <footer className="footer">

        <span>
          IndicVoice AI
        </span>

        <span>
          Multilingual • Voice-first • Agentic
        </span>

      </footer>

    </div>
  );
}

export default App;