import unittest
from backend.agent.intent import extract_intent

class TestIntentExtraction(unittest.TestCase):
    def test_english_travel_search(self):
        query = "Chennai to Bangalore tomorrow morning cheapest train"
        intent = extract_intent(query)
        self.assertEqual(intent["intent"], "travel_search")
        self.assertEqual(intent["origin"].lower(), "chennai")
        self.assertIn(intent["destination"].lower(), ["bangalore", "bengaluru"])
        self.assertEqual(intent["date"], "tomorrow")
        self.assertEqual(intent["time"], "morning")
        self.assertEqual(intent["preference"], "cheapest")
        self.assertEqual(intent["transport_type"], "train")

    def test_tamil_code_switching_travel(self):
        query = "Chennai la irundhu Bangalore ku naalaiku morning cheap-a train paathu sollu"
        intent = extract_intent(query)
        self.assertEqual(intent["intent"], "travel_search")
        self.assertEqual(intent["origin"].lower(), "chennai")
        self.assertIn(intent["destination"].lower(), ["bangalore", "bengaluru"])
        self.assertEqual(intent["date"], "tomorrow")
        self.assertEqual(intent["time"], "morning")
        self.assertEqual(intent["preference"], "cheapest")
        self.assertEqual(intent["transport_type"], "train")
        self.assertEqual(intent["language"], "ta-en")

    def test_hindi_code_switching_flight(self):
        query = "Delhi se Mumbai kal subah cheapest flight"
        intent = extract_intent(query)
        self.assertEqual(intent["intent"], "travel_search")
        self.assertEqual(intent["origin"].lower(), "delhi")
        self.assertEqual(intent["destination"].lower(), "mumbai")
        self.assertEqual(intent["date"], "tomorrow")
        self.assertEqual(intent["time"], "morning")
        self.assertEqual(intent["preference"], "cheapest")
        self.assertEqual(intent["transport_type"], "flight")
        self.assertEqual(intent["language"], "hi-en")

    def test_product_search_headphones(self):
        query = "5000 ke andar wireless headphones"
        intent = extract_intent(query)
        self.assertEqual(intent["intent"], "product_search")
        self.assertIn("headphone", intent["product"].lower())
        self.assertEqual(intent["budget"], 5000.0)

    def test_web_search_news(self):
        query = "latest AI news"
        intent = extract_intent(query)
        self.assertEqual(intent["intent"], "web_search")
        self.assertIn("news", intent["query"].lower())

    def test_general_chat(self):
        query = "hello how are you"
        intent = extract_intent(query)
        self.assertEqual(intent["intent"], "general_chat")

if __name__ == "__main__":
    unittest.main()
