/**
 * Tutorial playable — ENGLISH copy only.
 * Edit this file to iterate on the concept. Reload the browser — no Unity rebuild.
 */
window.TUTORIAL_COPY = {
  hud: {
    teamTricks: "Team tricks: {current} / {goal}",
    teamTricksMade: "Team tricks: {current} / {goal} · +{points}",
    bags: "+{bags} bag{s}",
    you: "YOU",
    partner: "PARTNER",
    left: "LEFT",
    right: "RIGHT",
    us: "US",
    them: "THEM",
    restart: "Restart",
  },

  flash: {
    you: "You won the trick!",
    partner: "Partner won the trick!",
    them: "They won the trick",
    bag: "Overtrick · bag +1",
  },

  steps: {
    intro: {
      title: "Welcome to Spades",
      body: "Four players. You and the player across from you are a team. You win tricks together.",
      cta: "Next",
    },
    goal: {
      title: "Your contract",
      body: "This hand your team bid 4. Take 4 tricks together to make the contract (about 40 points).",
      footnote: "A trick is one card from each player — four cards total. Play out the full hand.",
      cta: "Got it",
    },
    trickExplained: {
      title: "That's a trick",
      body: "The highest card of the suit that was led wins the trick. Your team's count goes up when you or your partner wins.",
      cta: "Continue",
    },
    followSuit: {
      tip: "Clubs were led — play a club if you have one.",
    },
    followSuitError: {
      tip: "You have that suit — you must play it.",
    },
    youWonLead: {
      tip: "Nice! You won that trick. Now you lead — pick a suit (not Spades yet).",
    },
    spadesTrump: {
      tip: "Spades are trump! A Spade beats any other suit.",
    },
    spadesBroken: {
      tip: "Spades are broken — now Spades can be led.",
    },
    spadesLeadError: {
      tip: "Spades can't lead until someone plays a Spade in another trick.",
    },
    contractMade: {
      title: "Contract made!",
      body: "Your team took 4 tricks. Score: 10 × bid = +40 points. Finish the remaining tricks — overtricks become bags (+1 each).",
      cta: "Keep playing",
    },
    handComplete: {
      title: "Hand complete",
      body: "All 13 tricks are done. You made the bid for +{points}{bagsNote}. Basics covered: teams, tricks, follow suit, trump, and scoring.",
      cta: "Restart tutorial",
    },
    handCompleteMissed: {
      title: "Hand complete",
      body: "All 13 tricks are done. Your team took {tricks} of 4 needed — in a real game you'd miss the bid. Try again and aim for the contract.",
      cta: "Restart tutorial",
    },
  },
};
