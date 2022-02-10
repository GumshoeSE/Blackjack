((deckOfCards) => {
	const uri = "https://deckofcardsapi.com";
	const cardBack = `images/cardback.png`;
	const modal = document.querySelector("#game-result-modal");
	const bootstrapModal = new bootstrap.Modal(modal);
	let playerCardValues = [];
	let opponentCardValues = [];
	let deckId = null;
	let hiddenCard = null;

	deckOfCards.fetchCard = (e) => {
		const isPlayer = e != null ? showLoadButton(e.target) : false;

		return fetch(getFullURI())
			.then((res) => res.json())
			.then((data) => {
				const cardData = data["cards"][0];
				const cardValues = isPlayer ? playerCardValues : opponentCardValues;
				const cardContainer = isPlayer
					? document.querySelector("#player-cards-container")
					: document.querySelector("#opponent-cards-container");
				const scoreLabel = isPlayer
					? document.querySelector("#score-player")
					: document.querySelector("#score-opponent");
				const cardImageSrc = !isPlayer && opponentCardValues.length == 0 ? cardBack : cardData["image"];

				hiddenCard ??= cardData["image"];
				deckId ??= data["deck_id"];
				cardValues.push(cardData["value"]);

				const card = document.createElement("img");
				card.setAttribute("src", cardImageSrc);
				card.setAttribute("class", "card-drawn");
				card.setAttribute("draggable", "false");
				cardContainer.appendChild(card);

				let score = calculateScore(cardValues, !isPlayer);
				scoreLabel.setAttribute("value", score);

				if (score > 21) showResults(isPlayer);
			})
			.then((_) => isPlayer && showDrawCardButton(e.target))
			.catch((err) => console.log(err));
	};

	deckOfCards.hold = () => {
		const cardContainer = document.querySelector("#opponent-cards-container");
		const scoreLabel = document.querySelector("#score-opponent");
		const scorePlayer = calculateScore(playerCardValues, false);
		let scoreOpponent = calculateScore(opponentCardValues, false);

		let tryToBeatPlayer = async () => {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			deckOfCards.fetchCard().then(() => {
				scoreOpponent = calculateScore(opponentCardValues, false);
				scoreLabel.setAttribute("value", scoreOpponent);
				if (scoreOpponent > scorePlayer && scoreOpponent <= 21) {
					showResults(true);
					enableAllButtons();
				}
				// try to draw another card if score is tied at 15 or below
				else if (scoreOpponent == scorePlayer && scoreOpponent > 15) {
					showResults(null);
					enableAllButtons();
				} else if (scoreOpponent > 21) {
					showResults(false);
					enableAllButtons();
				} else {
					tryToBeatPlayer(null);
				}
			});
		};

		disableAllButtons();

		cardContainer.firstChild.setAttribute("src", hiddenCard);
		scoreLabel.setAttribute("value", scoreOpponent);

		if (scoreOpponent > scorePlayer || scoreOpponent > 21) {
			showResults(true);
			enableAllButtons();
		}
		// draw another card if score is tied 15 or below
		else if (scoreOpponent == scorePlayer && scoreOpponent > 15) {
			showResults(null);
			enableAllButtons();
		} else tryToBeatPlayer(null);
	};

	deckOfCards.replay = () => {
		bootstrapModal.hide();
		// to ensure the modal backdrop is gone
		document.querySelector("body").classList.remove("modal-open");
		document.querySelector(".modal-backdrop").remove();

		deckOfCards.dealStarterCards();
	};

	deckOfCards.dealStarterCards = function () {
		resetBoard();
		deckOfCards.fetchCard();
		deckOfCards.fetchCard();

		const playerButton = document.querySelector("#player-draw-card-button");
		deckOfCards.fetchCard({ target: playerButton });
		deckOfCards.fetchCard({ target: playerButton });
	};

	deckOfCards.close = () => {
		disableAllButtons();
	};

	function getFullURI() {
		let id = deckId ?? "new";
		return `${uri}/api/deck/${id}/draw/?count=1`;
	}

	function showLoadButton(button) {
		button.setAttribute("disabled", true);
		button.innerHTML =
			'<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
		return true;
	}

	function showDrawCardButton(button) {
		button.removeAttribute("disabled");
		button.innerHTML = "Draw";
		return true;
	}

	function disableAllButtons() {
		document.querySelectorAll("button").forEach((button) => {
			if (button.id != "new-game-button") button.disabled = true;
		});
	}

	function enableAllButtons() {
		document.querySelectorAll("button").forEach((button) => (button.disabled = false));
	}

	function showResults(playerLost) {
		const modalContent = modal.querySelector(".modal-content");
		const modalBody = modalContent.querySelector(".modal-body");
		let message = "";

		if (playerLost === null) {
			message = "A draw, almost got it!";
			modalContent.style["color"] = "blue";
		} else if (playerLost) {
			message = "You lost, better luck next time!";
			modalContent.style["color"] = "red";
		} else {
			message = "You won, congratulations!";
			modalContent.style["color"] = "green";
		}
		modalBody.innerText = message;
		bootstrapModal.show();
	}

	function calculateScore(cardValues, skipFirst) {
		let score = 0;
		let numAces = 0;
		if (skipFirst) cardValues = cardValues.slice(1);
		cardValues.forEach((value) => {
			if (isNumeric(value)) score += parseInt(value);
			else if (value == "ACE") {
				score += 11;
				numAces++;
			} else {
				score += 10;
			}
			// If over 21 count aces as value 1
			if (score > 21 && numAces > 0) {
				score -= 10;
				numAces--;
			}
		});
		return score;
	}

	function isNumeric(str) {
		if (typeof str != "string") return false;
		return !isNaN(str) && !isNaN(parseFloat(str));
	}

	function resetBoard() {
		document.querySelector("#player-cards-container").innerHTML = "";
		document.querySelector("#opponent-cards-container").innerHTML = "";
		document.querySelector("#score-player").setAttribute("value", 0);
		document.querySelector("#score-opponent").setAttribute("value", 0);
		playerCardValues = [];
		opponentCardValues = [];
		deckId = null;
		hiddenCard = null;
		enableAllButtons();
	}

	document
		.querySelector("#player-draw-card-button")
		.addEventListener("click", deckOfCards.fetchCard);
	document.querySelector("#hold-button").addEventListener("click", deckOfCards.hold);
	document.querySelector("#replay-button").addEventListener("click", deckOfCards.replay);
	document.querySelector("#close-button").addEventListener("click", deckOfCards.close);
	document.querySelector("#header-close-button").addEventListener("click", deckOfCards.close);
	document
		.querySelector("#new-game-button")
		.addEventListener("click", deckOfCards.dealStarterCards);
	deckOfCards.dealStarterCards();
})((window.deckOfCards = window.deckOfCards || {}));
