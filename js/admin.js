(function initAdminPanel() {
  if (typeof getAdminSession === "function" && !getAdminSession()) {
    return;
  }

  const tourForm = document.getElementById("tourForm");
  const tourIdInput = document.getElementById("tourId");
  const titleInput = document.getElementById("title");
  const descriptionInput = document.getElementById("description");
  const priceInput = document.getElementById("price");
  const durationInput = document.getElementById("duration");
  const imageInput = document.getElementById("image");
  const imagesUploadInput = document.getElementById("imagesUpload");
  const imagesUploadInfo = document.getElementById("imagesUploadInfo");
  const fileUploadWrap = document.querySelector(".admin-file-upload");
  const galleryUrlsInput = document.getElementById("galleryUrls");
  const adminImagesPreview = document.getElementById("adminImagesPreview");
  const aiSuggestCategoriesBtn = document.getElementById("aiSuggestCategoriesBtn");
  const categoryTriggerBtn = document.getElementById("categoryTriggerBtn");
  const categoryDropdown = document.getElementById("categoryDropdown");
  const submitBtn = document.getElementById("submitBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const formHint = document.getElementById("formHint");
  const adminList = document.getElementById("adminList");

  if (!tourForm || !adminList || !categoryTriggerBtn || !categoryDropdown) {
    return;
  }

  let tours = readToursFromStorage();
  let pendingUploadedImages = [];
  let orderedGalleryImages = [];
  let dragImageIndex = null;

  function getAuthToken() {
    return localStorage.getItem("agencyAuthToken") || "";
  }

  async function apiToursRequest(path, options = {}) {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Нужна авторизация администратора.");
    }

    const response = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    });

    if (response.status === 204) {
      return null;
    }

    let payload = null;
    try {
      payload = await response.json();
    } catch (error) {
      payload = null;
    }

    if (!response.ok) {
      throw new Error(payload?.error || "Ошибка запроса к серверу.");
    }

    return payload;
  }

  async function loadToursFromApi() {
    try {
      const response = await fetch("/api/tours");
      if (!response.ok) {
        throw new Error("Tours API unavailable");
      }

      const payload = await response.json();
      if (!Array.isArray(payload)) {
        throw new Error("Invalid tours response");
      }

      tours = payload;
      saveToursToStorage(tours);
    } catch (error) {
      tours = readToursFromStorage();
    }
  }

  function readFilesAsDataUrls(fileList) {
    const files = Array.from(fileList || []).slice(0, 12);
    const fileReaders = files
      .filter((file) => String(file.type || "").startsWith("image/"))
      .map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
            reader.onerror = () => resolve("");
            reader.readAsDataURL(file);
          })
      );

    return Promise.all(fileReaders).then((items) => items.filter(Boolean));
  }

  async function handleSelectedImages(fileList) {
    pendingUploadedImages = await readFilesAsDataUrls(fileList);
    renderImagesPreview();

    if (imagesUploadInfo instanceof HTMLElement) {
      imagesUploadInfo.textContent =
        pendingUploadedImages.length > 0
          ? `Выбрано фото: ${pendingUploadedImages.length}`
          : "Файлы не выбраны";
    }

    if (pendingUploadedImages.length > 0) {
      setHint(`Загружено фото: ${pendingUploadedImages.length}. Можно сохранять тур.`);
      if (fileUploadWrap instanceof HTMLElement) {
        fileUploadWrap.classList.remove("is-uploaded");
        requestAnimationFrame(() => {
          fileUploadWrap.classList.add("is-uploaded");
        });
      }
    }
  }

  function parseGalleryUrls() {
    if (!(galleryUrlsInput instanceof HTMLTextAreaElement)) {
      return [];
    }

    return String(galleryUrlsInput.value || "")
      .split(/\r?\n/)
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .map((item) => sanitizeImageUrl(item, ""))
      .filter(Boolean);
  }

  function writeGalleryUrlsFromList(urls) {
    if (!(galleryUrlsInput instanceof HTMLTextAreaElement)) {
      return;
    }

    galleryUrlsInput.value = urls.join("\n");
  }

  function getRawGalleryImages() {
    const coverUrl = sanitizeImageUrl(imageInput.value, "");
    const manualGallery = parseGalleryUrls();
    return [coverUrl, ...pendingUploadedImages, ...manualGallery].filter(Boolean);
  }

  function syncOrderedGalleryImages() {
    const raw = getRawGalleryImages();
    if (raw.length === 0) {
      orderedGalleryImages = [];
      return;
    }

    if (orderedGalleryImages.length === 0) {
      orderedGalleryImages = Array.from(new Set(raw));
      return;
    }

    const rawSet = new Set(raw);
    const kept = orderedGalleryImages.filter((item) => rawSet.has(item));
    const additions = raw.filter((item) => !kept.includes(item));
    orderedGalleryImages = Array.from(new Set([...kept, ...additions]));
  }

  function renderImagesPreview() {
    if (!(adminImagesPreview instanceof HTMLElement)) {
      return;
    }

    syncOrderedGalleryImages();

    if (orderedGalleryImages.length === 0) {
      adminImagesPreview.innerHTML = '<p class="admin-empty">Фото пока не добавлены.</p>';
      return;
    }

    adminImagesPreview.innerHTML = orderedGalleryImages
      .map(
        (imageUrl, index) => `
          <article class="admin-image-preview-item${index === 0 ? " is-cover" : ""}" draggable="true" data-index="${index}">
            <img src="${imageUrl}" alt="Фото тура ${index + 1}" loading="lazy" />
            <div class="admin-image-preview-meta">
              <span>${index === 0 ? "Обложка" : `Фото ${index + 1}`}</span>
              <div class="admin-image-preview-actions">
                <button class="btn btn-secondary js-make-cover" type="button" data-index="${index}">В обложку</button>
                <button class="btn btn-primary js-remove-image" type="button" data-index="${index}">Удалить</button>
              </div>
            </div>
          </article>
        `
      )
      .join("");
  }

  function removeImageFromSourcesByValue(imageUrl) {
    const normalizedImage = String(imageUrl || "").trim();
    if (!normalizedImage) {
      return;
    }

    const coverImage = sanitizeImageUrl(imageInput.value, "");
    if (coverImage && coverImage === normalizedImage) {
      imageInput.value = "";
    }

    pendingUploadedImages = pendingUploadedImages.filter((item) => String(item || "").trim() !== normalizedImage);

    const filteredManual = parseGalleryUrls().filter((item) => String(item || "").trim() !== normalizedImage);
    writeGalleryUrlsFromList(filteredManual);
  }

  function buildTourImages() {
    syncOrderedGalleryImages();
    if (orderedGalleryImages.length === 0) {
      return [TOUR_FALLBACK_IMAGE];
    }

    return orderedGalleryImages;
  }

  function getSelectedCategories() {
    const selectedNodes = categoryDropdown.querySelectorAll('input[type="checkbox"]:checked');
    return Array.from(selectedNodes)
      .map((node) => String(node.value || "").trim())
      .filter(Boolean);
  }

  function updateCategoryTriggerLabel() {
    const selectedCategories = getSelectedCategories();
    if (selectedCategories.length === 0) {
      categoryTriggerBtn.textContent = "Выбрать направления";
      return;
    }

    if (selectedCategories.length <= 2) {
      categoryTriggerBtn.textContent = selectedCategories.join(" • ");
      return;
    }

    const preview = selectedCategories.slice(0, 2).join(" • ");
    categoryTriggerBtn.textContent = `${preview} +${selectedCategories.length - 2}`;
  }

  function renderCategoryCheckboxes(selectedCategories = []) {
    const selectedSet = new Set(selectedCategories.map((item) => String(item || "")));
    const options = getTourCategoryOptions();

    categoryDropdown.innerHTML = options
      .map((category) => {
        const safeCategory = escapeHtml(category);
        const checkedAttr = selectedSet.has(category) ? " checked" : "";

        return `
          <label class="admin-category-option">
            <input class="admin-category-checkbox" type="checkbox" value="${safeCategory}"${checkedAttr} />
            <span class="admin-category-option-mark" aria-hidden="true"></span>
            <span class="admin-category-option-text">${safeCategory}</span>
          </label>
        `;
      })
      .join("");

    categoryDropdown.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.addEventListener("change", updateCategoryTriggerLabel);
    });

    updateCategoryTriggerLabel();
  }

  function setHint(text) {
    formHint.textContent = text;
  }

  function applySuggestedCategories() {
    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();

    if (description.length < 8 && title.length < 4) {
      setHint("Добавьте более подробное описание тура, чтобы ИИ предложил направления.");
      return;
    }

    const suggested =
      typeof suggestTourCategoriesByText === "function"
        ? suggestTourCategoriesByText(title, description, 4)
        : [];

    if (!Array.isArray(suggested) || suggested.length === 0) {
      setHint("ИИ не смог определить направления. Выберите их вручную.");
      return;
    }

    const selectedSet = new Set(suggested.map((item) => String(item || "").trim()));
    categoryDropdown.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.checked = selectedSet.has(String(checkbox.value || "").trim());
    });

    updateCategoryTriggerLabel();
    categoryDropdown.classList.remove("is-hidden");
    setHint(`ИИ выбрал направления: ${suggested.join(", ")}.`);
  }

  function resetForm() {
    tourForm.reset();
    tourIdInput.value = "";
    pendingUploadedImages = [];
    orderedGalleryImages = [];
    renderCategoryCheckboxes([]);
    renderImagesPreview();
    if (imagesUploadInfo instanceof HTMLElement) {
      imagesUploadInfo.textContent = "Файлы не выбраны";
    }
    submitBtn.textContent = "Добавить тур";
    setHint("Введите данные нового тура и нажмите «Добавить тур». ");
  }

  function validateForm() {
    if (!titleInput.value.trim()) {
      setHint("Введите название тура.");
      return false;
    }
    if (!descriptionInput.value.trim()) {
      setHint("Введите описание тура.");
      return false;
    }

    const priceValue = Number(priceInput.value);
    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      setHint("Цена должна быть больше 0.");
      return false;
    }

    if (!durationInput.value.trim()) {
      setHint("Введите длительность тура.");
      return false;
    }

    if (!/^\d+\s*\+\s*\d+$/.test(durationInput.value.trim())) {
      setHint("Формат длительности: количество дней + дни в дороге (например, 7 + 2).");
      return false;
    }

    if (getSelectedCategories().length === 0) {
      setHint("Выберите хотя бы одно направление.");
      return false;
    }

    const coverValue = String(imageInput.value || "").trim();
    if (coverValue) {
      const safeCover = sanitizeImageUrl(coverValue, "");
      if (!safeCover) {
        setHint("Укажите корректную ссылку на обложку или оставьте поле пустым.");
        return false;
      }
    }

    syncOrderedGalleryImages();
    if (orderedGalleryImages.length === 0) {
      setHint("Добавьте хотя бы одно фото: ссылка, несколько ссылок или загрузка файлов.");
      return false;
    }

    return true;
  }

  function renderList() {
    if (tours.length === 0) {
      adminList.innerHTML = '<p class="admin-empty">Список пуст. Добавьте первый тур.</p>';
      return;
    }

    adminList.innerHTML = tours
      .map((tour) => {
        const safeId = escapeHtml(tour.id);
        const safeImage = sanitizeUrl(tour.image, TOUR_FALLBACK_IMAGE);
        const safeFallbackImage = sanitizeUrl(TOUR_FALLBACK_IMAGE, TOUR_FALLBACK_IMAGE);
        const safeTitle = escapeHtml(tour.title);
        const safeDescription = escapeHtml(tour.description);
        const safePrice = escapeHtml(formatEuro(tour.price));
        const safeDuration = escapeHtml(formatDurationLabel(tour.duration));
        const safeCategories = getTourCategories(tour)
          .map((category) => `<span class="admin-tour-chip">${escapeHtml(category)}</span>`)
          .join("");

        return `
          <article class="admin-item" data-id="${safeId}">
            <img src="${safeImage}" alt="${safeTitle}" loading="lazy" onerror="this.onerror=null;this.src='${safeFallbackImage}';" />
            <div class="admin-item-content">
              <div class="admin-item-head">
                <h3>${safeTitle}</h3>
                <span class="admin-tour-id">#${safeId}</span>
              </div>
              <p class="admin-description">${safeDescription}</p>
              <div class="admin-tour-chips">${safeCategories}</div>
              <div class="admin-tour-meta">
                <p><strong>${safePrice}</strong></p>
                <p>${safeDuration}</p>
              </div>
            </div>
            <div class="admin-actions">
              <button type="button" class="btn btn-secondary js-edit">Редактировать</button>
              <button type="button" class="btn btn-primary js-delete">Удалить</button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function updateStorageAndRender(message) {
    saveToursToStorage(tours);
    renderList();
    setHint(message);
  }

  async function addTour() {
    const images = buildTourImages();

    const newTour = {
      id: `t-${Date.now()}`,
      title: titleInput.value.trim(),
      description: descriptionInput.value.trim(),
      price: Number(priceInput.value),
      duration: normalizeDuration(durationInput.value),
      categories: getSelectedCategories(),
      image: images[0],
      images
    };

    try {
      const createdTour = await apiToursRequest("/api/tours", {
        method: "POST",
        body: JSON.stringify(newTour)
      });
      tours.unshift(createdTour);
    } catch (error) {
      tours.unshift(newTour);
    }

    updateStorageAndRender("Тур добавлен. Если интеграция настроена, тур отправлен в TG-бот.");
    resetForm();
  }

  async function saveEditedTour(id) {
    const images = buildTourImages();

    const updatedTour = {
      id,
      title: titleInput.value.trim(),
      description: descriptionInput.value.trim(),
      price: Number(priceInput.value),
      duration: normalizeDuration(durationInput.value),
      categories: getSelectedCategories(),
      image: images[0],
      images
    };

    try {
      const serverTour = await apiToursRequest(`/api/tours/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(updatedTour)
      });
      tours = tours.map((tour) => (tour.id === id ? serverTour : tour));
    } catch (error) {
      tours = tours.map((tour) => (tour.id === id ? { ...tour, ...updatedTour } : tour));
    }

    updateStorageAndRender("Изменения сохранены.");
    resetForm();
  }

  function fillFormForEdit(tour) {
    tourIdInput.value = tour.id;
    titleInput.value = tour.title;
    descriptionInput.value = tour.description;
    priceInput.value = tour.price;
    durationInput.value = tour.duration;
    renderCategoryCheckboxes(getTourCategories(tour));
    imageInput.value = tour.image;
    pendingUploadedImages = [];
    orderedGalleryImages = Array.isArray(tour.images) ? [...tour.images] : [tour.image];
    if (galleryUrlsInput instanceof HTMLTextAreaElement) {
      const extraUrls = Array.isArray(tour.images) ? tour.images.slice(1) : [];
      galleryUrlsInput.value = extraUrls.join("\n");
    }
    renderImagesPreview();
    submitBtn.textContent = "Сохранить";
    setHint("Режим редактирования: внесите изменения и нажмите «Сохранить».");
    titleInput.focus();
  }

  imageInput.addEventListener("input", renderImagesPreview);
  if (galleryUrlsInput instanceof HTMLTextAreaElement) {
    galleryUrlsInput.addEventListener("input", renderImagesPreview);
  }

  if (imagesUploadInput instanceof HTMLInputElement) {
    imagesUploadInput.addEventListener("change", async () => {
      await handleSelectedImages(imagesUploadInput.files);
    });
  }

  if (fileUploadWrap instanceof HTMLElement) {
    const preventDefaults = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    ["dragenter", "dragover"].forEach((eventName) => {
      fileUploadWrap.addEventListener(eventName, (event) => {
        preventDefaults(event);
        fileUploadWrap.classList.add("is-dragover");
      });
    });

    ["dragleave", "drop"].forEach((eventName) => {
      fileUploadWrap.addEventListener(eventName, (event) => {
        preventDefaults(event);
        fileUploadWrap.classList.remove("is-dragover");
      });
    });

    fileUploadWrap.addEventListener("drop", async (event) => {
      const files = event.dataTransfer?.files;
      if (!files || files.length === 0) {
        return;
      }

      await handleSelectedImages(files);
    });
  }

  if (adminImagesPreview instanceof HTMLElement) {
    adminImagesPreview.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const removeBtn = target.closest(".js-remove-image");
      if (removeBtn) {
        const index = Number(removeBtn.getAttribute("data-index"));
        if (Number.isInteger(index) && index >= 0) {
          const imageToRemove = orderedGalleryImages[index];
          orderedGalleryImages = orderedGalleryImages.filter((_, imageIndex) => imageIndex !== index);
          removeImageFromSourcesByValue(imageToRemove);
          renderImagesPreview();
        }
        return;
      }

      const coverBtn = target.closest(".js-make-cover");
      if (coverBtn) {
        const index = Number(coverBtn.getAttribute("data-index"));
        if (!Number.isInteger(index) || index <= 0 || index >= orderedGalleryImages.length) {
          return;
        }

        const [picked] = orderedGalleryImages.splice(index, 1);
        orderedGalleryImages.unshift(picked);
        renderImagesPreview();
      }
    });

    adminImagesPreview.addEventListener("dragstart", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const item = target.closest(".admin-image-preview-item");
      if (!(item instanceof HTMLElement)) {
        return;
      }

      dragImageIndex = Number(item.getAttribute("data-index"));
    });

    adminImagesPreview.addEventListener("dragover", (event) => {
      event.preventDefault();
    });

    adminImagesPreview.addEventListener("drop", (event) => {
      event.preventDefault();
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const item = target.closest(".admin-image-preview-item");
      const toIndex = item ? Number(item.getAttribute("data-index")) : -1;
      if (!Number.isInteger(dragImageIndex) || dragImageIndex < 0 || !Number.isInteger(toIndex) || toIndex < 0) {
        dragImageIndex = null;
        return;
      }

      if (dragImageIndex === toIndex) {
        dragImageIndex = null;
        return;
      }

      const next = [...orderedGalleryImages];
      const [moved] = next.splice(dragImageIndex, 1);
      next.splice(toIndex, 0, moved);
      orderedGalleryImages = next;
      dragImageIndex = null;
      renderImagesPreview();
    });
  }

  tourForm.addEventListener("submit", (event) => {
    event.preventDefault();

    Promise.resolve().then(async () => {
      if (!validateForm()) {
        return;
      }

      const editingId = tourIdInput.value;
      if (editingId) {
        await saveEditedTour(editingId);
        return;
      }

      await addTour();
    });
  });

  cancelEditBtn.addEventListener("click", resetForm);

  if (aiSuggestCategoriesBtn) {
    aiSuggestCategoriesBtn.addEventListener("click", applySuggestedCategories);
  }

  categoryTriggerBtn.addEventListener("click", () => {
    categoryDropdown.classList.toggle("is-hidden");
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (!target.closest("#adminCategoryPicker")) {
      categoryDropdown.classList.add("is-hidden");
    }
  });

  adminList.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const item = target.closest(".admin-item");
    if (!item) {
      return;
    }

    const { id } = item.dataset;
    if (!id) {
      return;
    }

    const deleteBtn = target.closest(".js-delete");
    if (deleteBtn) {
      try {
        await apiToursRequest(`/api/tours/${encodeURIComponent(id)}`, { method: "DELETE" });
      } catch (error) {
      }

      tours = tours.filter((tour) => tour.id !== id);
      updateStorageAndRender("Тур удалён.");
      if (tourIdInput.value === id) {
        resetForm();
      }
      return;
    }

    const editBtn = target.closest(".js-edit");
    if (editBtn) {
      const tourToEdit = tours.find((tour) => tour.id === id);
      if (tourToEdit) {
        fillFormForEdit(tourToEdit);
      }
    }
  });

  renderCategoryCheckboxes([]);
  renderImagesPreview();
  loadToursFromApi().then(() => {
    renderList();
    resetForm();
  });
})();
