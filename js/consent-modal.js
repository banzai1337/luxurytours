(function () {
  const STORAGE_KEY = "luxuryToursAgreementAcceptedV1";

  function hasAcceptedAgreement() {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch (error) {
      return false;
    }
  }

  function saveAgreementAcceptance() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch (error) {
    }
  }

  function buildModal() {
    const overlay = document.createElement("div");
    overlay.className = "agreement-overlay";
    overlay.innerHTML = `
      <div class="agreement-modal" role="dialog" aria-modal="true" aria-labelledby="agreementTitle">
        <h2 class="agreement-title" id="agreementTitle">Пользовательское соглашение</h2>
        <p class="agreement-text">
          Продолжая пользоваться сайтом LuxuryTours, вы подтверждаете, что ознакомились с условиями
          использования сервиса и политикой обработки персональных данных.
        </p>
        <div class="agreement-actions">
          <button type="button" class="btn btn-secondary agreement-read-btn" id="agreementReadBtn">Я прочитал(а)</button>
          <button type="button" class="btn agreement-confirm-btn" id="agreementConfirmBtn" disabled>Подтвердить</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.classList.add("agreement-lock");

    const readButton = overlay.querySelector("#agreementReadBtn");
    const confirmButton = overlay.querySelector("#agreementConfirmBtn");
    let isReadConfirmed = false;

    readButton.addEventListener("click", function () {
      isReadConfirmed = true;
      readButton.disabled = true;
      readButton.classList.add("is-checked");
      readButton.textContent = "Прочитано";
      confirmButton.disabled = false;
      confirmButton.focus();
    });

    confirmButton.addEventListener("click", function () {
      if (!isReadConfirmed) return;
      saveAgreementAcceptance();
      document.body.classList.remove("agreement-lock");
      overlay.remove();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (hasAcceptedAgreement()) return;
    buildModal();
  });
})();