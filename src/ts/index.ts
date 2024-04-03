import { Product } from "./Product";

const serverUrl = "http://localhost:5000";

const contentSection = document.querySelector(".main-section") as HTMLElement;
const cartCounter = document.querySelector(".cart-counter");
const headerContainer = document.querySelector(".header-container");
const cartItemsContainer = document.querySelector(".cart-items");
const cartToggleStateButton = document.querySelector(".cart-link");

const loadMoreButton = document.createElement("button");
loadMoreButton.classList.add("load-more-button");
loadMoreButton.textContent = "Carregar Mais";
const fallbackMessageText = "Não existem mais produtos.";
const noProductsText = "Nenhum produto encontrado para os filtros.";

let currentPage = 1;
let productsPerPage: number;
let products: Product[] | null = [];
let cartItemIdCounter = 0;
let cartControlArray: Product[] | null;

const updateProductsPerPageByWindowSize = () =>
  window.innerWidth < 870 ? (productsPerPage = 4) : (productsPerPage = 9);

async function main() {
  updateProductsPerPageByWindowSize();
  await fetchProducts(currentPage);
  handleMobileOrderFilter();
  handleMobileMainFilter();
  handleColorExpand();
  handleProductFilters();
  adjustLoadMoreButtonVisibility();
}

window.addEventListener("resize", updateProductsPerPageByWindowSize);
document.addEventListener("DOMContentLoaded", main);

contentSection.appendChild(loadMoreButton);

const fetchProducts = async (page: number, filteredProducts?: Product[]) => {
  const contentUl = document.querySelector(".content") as HTMLElement;
  const fallbackMessage = document.querySelector(".fallback-message");

  if (fallbackMessage) {
    contentSection.removeChild(fallbackMessage);
  }

  const productsToShow = filteredProducts
    ? filteredProducts
    : await fetchAndFilterProducts(page);

  if (filteredProducts) contentUl.innerHTML = "";

  if (productsToShow.length === 0 && !filteredProducts) {
    showNoMoreProductsMessage();
    return;
  }

  products = [...products, ...productsToShow];

  productsToShow.forEach((item) => {
    const li = document.createElement("li");
    const img = document.createElement("img");
    const h2 = document.createElement("h2");
    const priceSpan = document.createElement("span");
    const paymentSpan = document.createElement("span");
    const button = document.createElement("button");

    priceSpan.classList.add("price");
    paymentSpan.classList.add("payment");

    img.src = item.image;
    h2.textContent = item.name;
    priceSpan.textContent = item.price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    paymentSpan.textContent = formatPaymentPlan(item.parcelamento);
    button.id = item.id;
    button.classList.add("cart-add-button");
    button.textContent = "comprar";

    li.appendChild(img);
    li.appendChild(h2);
    li.appendChild(priceSpan);
    li.appendChild(paymentSpan);
    li.appendChild(button);

    contentUl.appendChild(li);
  });
  currentPage++;
  loadCartFromLocalStorage();
  cartControl(products);
};

const fetchFilteredProducts = async (
  page: number,
  activeFilters?: string[]
) => {
  const filteredProducts = await fetchAndFilterProducts(page, activeFilters);

  if (filteredProducts.length === 0) {
    showNoProductsFoundMessage();
    contentSection.contains(loadMoreButton) &&
      contentSection.removeChild(loadMoreButton);
  }
  await fetchProducts(page, filteredProducts);
};

const showNoProductsFoundMessage = () => {
  const message = document.createElement("div");
  message.textContent = noProductsText;
  message.classList.add("no-products-found-message");
  contentSection.appendChild(message);
};

const fetchAndFilterProducts = async (
  page: number,
  activeFilters?: string[]
) => {
  const response = await fetch(`${serverUrl}/products`);
  let productsToShow = (await response.json()) as Product[];

  if (activeFilters) {
    productsToShow = filterProducts(productsToShow, activeFilters);
  }

  const startIndex = (page - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;

  return activeFilters
    ? productsToShow
    : productsToShow.slice(startIndex, endIndex);
};

const loadMoreProducts = async () => {
  const filterCheckboxes = document.querySelectorAll<HTMLInputElement>(
    "input[type=checkbox]"
  );
  const activeFilters = Array.from(filterCheckboxes)
    .filter((c) => c.checked)
    .map((c) => c.id);

  if (!activeFilters.length) {
    await fetchProducts(currentPage);
  }
};

loadMoreButton.addEventListener("click", loadMoreProducts);

const showNoMoreProductsMessage = () => {
  const message = document.createElement("p");
  message.textContent = fallbackMessageText;
  message.classList.add("fallback-message");
  contentSection.appendChild(message);
  contentSection.removeChild(loadMoreButton);
};

const formatPaymentPlan = (data: number[]): string => {
  return `até ${data[0]}x de ${data[1].toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })}`;
};

const cartControl = (productsToShow: Product[]) => {
  const cartButtons = document.querySelectorAll(".cart-add-button");
  products = productsToShow;

  cartButtons.forEach((button) => {
    button.removeEventListener("click", handleAddToCartClick);
  });

  cartButtons.forEach((button) => {
    button.addEventListener("click", handleAddToCartClick);
  });

  const handleCartToggleStateClick = () => {
    if (cartItemsContainer.classList.contains("active")) {
      cartItemsContainer.classList.add("cart-exit");
    } else {
      cartItemsContainer.classList.add("active");
      cartItemsContainer.classList.remove("cart-exit");
    }
  };

  const handleCartItemsContainerAnimationExit = (event: AnimationEvent) => {
    if (event.animationName === "cart-exit") {
      cartItemsContainer.classList.remove("active");
      cartItemsContainer.classList.remove("cart-exit");
    }
  };

  cartToggleStateButton.removeEventListener(
    "click",
    handleCartToggleStateClick
  );
  if (!cartToggleStateButton.hasAttribute("data-listener-added")) {
    cartToggleStateButton.addEventListener("click", handleCartToggleStateClick);
    cartToggleStateButton.setAttribute("data-listener-added", "true");
  }
  cartItemsContainer.removeEventListener(
    "animationend",
    handleCartItemsContainerAnimationExit
  );
  cartItemsContainer.addEventListener(
    "animationend",
    handleCartItemsContainerAnimationExit
  );
};

const handleCartCounter = (cartControlArray: Product[] | null) => {
  if (cartControlArray.length !== 0) {
    cartCounter.classList.remove("hidden");
    cartCounter.textContent = cartControlArray.length.toString();
  } else {
    cartCounter.classList.add("hidden");
  }
};

const loadCartFromLocalStorage = () => {
  const savedCart = localStorage.getItem("cartItems");
  if (savedCart) {
    cartControlArray = JSON.parse(savedCart);
    handleCartItems(cartControlArray);
    handleCartCounter(cartControlArray);
  } else {
    cartControlArray = [];
    handleCartItems([]);
  }
};

const saveCartToLocalStorage = (cartControlArray: Product[] | null) => {
  localStorage.setItem("cartItems", JSON.stringify(cartControlArray));
};

const handleAddToCartClick = (event: Event) => {
  const target = event.target as HTMLElement;

  const productToAdd = products.find((product) => product.id === target.id);
  if (!productToAdd) return;

  const uniqueCartItemId = `${productToAdd.id}-${
    cartItemIdCounter++ * Math.random()
  }`;

  cartControlArray.push({ ...productToAdd, uniqueId: uniqueCartItemId });

  handleCartCounter(cartControlArray);
  handleCartItems(cartControlArray);
  handleCartNotifications(productToAdd);
  saveCartToLocalStorage(cartControlArray);
};

const handleCartItems = (cartControlArray: Product[] | null) => {
  cartItemsContainer.innerHTML = "";

  if (cartControlArray.length === 0 || cartControlArray === null) {
    const cartItemContainer = document.createElement("div");
    cartItemContainer.classList.add("cart-item");
    cartItemContainer.textContent = "Não há produtos no carrinho.";
    cartItemsContainer.appendChild(cartItemContainer);
  }

  cartControlArray.forEach((product) => {
    const cartItemContainer = document.createElement("div");
    const cartItemHeader = document.createElement("div");
    const cartItemHeaderName = document.createElement("span");
    const cartItemHeaderPrice = document.createElement("span");
    const cartItemImg = document.createElement("img");
    const cartItemRemoveButton = document.createElement("button");

    cartItemContainer.classList.add("cart-item");
    cartItemHeader.classList.add("cart-item-header");
    cartItemRemoveButton.dataset.uniqueId = product.uniqueId;

    cartItemHeaderName.textContent = product.name;
    cartItemHeaderPrice.textContent = product.price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    cartItemImg.src = product.image;

    cartItemsContainer.appendChild(cartItemContainer);
    cartItemContainer.appendChild(cartItemHeader);
    cartItemHeader.appendChild(cartItemHeaderName);
    cartItemHeader.appendChild(cartItemHeaderPrice);
    cartItemContainer.appendChild(cartItemImg);
    cartItemContainer.appendChild(cartItemRemoveButton);

    const handleRemoveButtonClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const uniqueCartItemId = target.dataset.uniqueId;

      cartControlArray = cartControlArray.filter(
        (item) => item.uniqueId !== uniqueCartItemId
      );
      saveCartToLocalStorage(cartControlArray);

      loadCartFromLocalStorage();

      handleCartCounter(cartControlArray);
      handleCartItems(cartControlArray);
    };

    cartItemRemoveButton.addEventListener("click", handleRemoveButtonClick);
  });
};

const handleCartNotifications = (productToAdd: Product) => {
  const cartNotificationContainer = document.createElement("div");
  cartNotificationContainer.classList.add("cart-notification");
  cartNotificationContainer.innerHTML = `<span>${productToAdd.name}</span> adicionado ao carrinho!`;
  headerContainer.appendChild(cartNotificationContainer);

  setTimeout(() => {
    cartNotificationContainer.classList.add("notification-exit");
  }, 3000);

  cartNotificationContainer.addEventListener("animationend", (event) => {
    event.animationName === "notification-exit" &&
      headerContainer.removeChild(cartNotificationContainer);
  });
};

const handleColorExpand = () => {
  const colorExpandButton = document.querySelector(".color-expand-button");
  const colorCheckboxes = document.querySelectorAll(".color-checkbox");

  const handleColorExpandButtonClick = () => {
    colorCheckboxes.forEach((checkbox) => {
      checkbox.classList.remove("hidden");
    });
    colorExpandButton.classList.add("hidden");
  };

  colorExpandButton.addEventListener("click", handleColorExpandButtonClick);
};

const filterProducts = (products: Product[], activeCheckboxes: string[]) => {
  return products.filter((product) => {
    return activeCheckboxes.some((checkbox) => {
      const filter = checkbox.replace(/-mobile$/, "");
      if (filter.startsWith("color-")) {
        return product.color.toLowerCase() === filter.slice(6);
      } else if (filter.startsWith("size-")) {
        return product.size.includes(filter.slice(5));
      } else if (filter.startsWith("price-")) {
        const [min, max] = filter.slice(6).split("-");
        return product.price >= +min && (+max ? product.price <= +max : true);
      }
      return false;
    });
  });
};

const handleProductFilters = () => {
  const filterCheckboxes = document.querySelectorAll<HTMLInputElement>(
    ".filters-wrapper input[type=checkbox]"
  );

  const handleFilterCheckboxesChange = async () => {
    removeNoProductsFoundMessage();
    currentPage = 1;
    const areFiltersUnchecked = Array.from(filterCheckboxes).every(
      (checkbox) => !checkbox.checked
    );

    if (!areFiltersUnchecked) {
      const activeFilters = Array.from(filterCheckboxes)
        .filter((c) => c.checked)
        .map((c) => c.id);

      await fetchFilteredProducts(currentPage, activeFilters);
    } else {
      await fetchFilteredProducts(currentPage);
    }
    adjustLoadMoreButtonVisibility();
  };

  filterCheckboxes.forEach((checkbox) =>
    checkbox.addEventListener("change", handleFilterCheckboxesChange)
  );
};

const adjustLoadMoreButtonVisibility = () => {
  const filterCheckboxes = document.querySelectorAll<HTMLInputElement>(
    "input[type=checkbox]"
  );
  const activeFilters = Array.from(filterCheckboxes)
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.id);

  if (activeFilters.length > 0) {
    if (contentSection.contains(loadMoreButton)) {
      contentSection.removeChild(loadMoreButton);
    }
  } else {
    if (!contentSection.contains(loadMoreButton)) {
      contentSection.appendChild(loadMoreButton);
    }
  }
};

const removeNoProductsFoundMessage = () => {
  const noProductsFoundMessage = document.querySelector(
    ".no-products-found-message"
  );
  if (noProductsFoundMessage) {
    contentSection.removeChild(noProductsFoundMessage);
  }
};

const handleMobileOrderFilter = () => {
  const orderFilterSection = document.querySelector(".order-filter");
  const orderFilterOpenButton = document.querySelector(
    ".mobile-button-order-filter"
  );
  const orderFilterCloseButton = document.querySelector(
    ".order-filter-close-button"
  );

  const handleOrderFilterOpenButtonClick = () => {
    orderFilterSection.classList.add("active");
    orderFilterSection.classList.remove("mobile-filter-exit");
  };

  const handleOrderFilterCloseButtonClick = () => {
    orderFilterSection.classList.add("mobile-filter-exit");
  };

  const handleOrderFilterAnimationEnd = (event: AnimationEvent) => {
    event.animationName === "mobile-filter-exit" &&
      orderFilterSection.classList.remove("active");
  };

  orderFilterOpenButton.addEventListener(
    "click",
    handleOrderFilterOpenButtonClick
  );

  orderFilterCloseButton.addEventListener(
    "click",
    handleOrderFilterCloseButtonClick
  );

  orderFilterSection.addEventListener(
    "animationend",
    handleOrderFilterAnimationEnd
  );
};

const handleMobileMainFilter = () => {
  const mainFilterSection = document.querySelector(".main-filter");
  const mainFilterOpenButton = document.querySelector(
    ".mobile-button-main-filter"
  );
  const mainFilterCloseButton = document.querySelector(
    ".main-filter-close-button"
  );

  handleMobileMainFilterDropdown();
  handleMobileFiltering();

  const handleMainFilterOpenButtonClick = () => {
    mainFilterSection.classList.add("active");
    mainFilterSection.classList.remove("mobile-filter-exit");
  };

  const handleMainFilterCloseButtonClick = () => {
    mainFilterSection.classList.add("mobile-filter-exit");
  };

  const handleMainFilterAnimationEnd = (event: AnimationEvent) => {
    event.animationName === "mobile-filter-exit" &&
      mainFilterSection.classList.remove("active");
  };

  mainFilterOpenButton.addEventListener(
    "click",
    handleMainFilterOpenButtonClick
  );

  mainFilterCloseButton.addEventListener(
    "click",
    handleMainFilterCloseButtonClick
  );

  mainFilterSection.addEventListener(
    "animationend",
    handleMainFilterAnimationEnd
  );
};

const handleMobileMainFilterDropdown = () => {
  const dropdownToggleButton = document.querySelectorAll(
    ".main-filter-content-submenu"
  );
  const mobileColorsFilterSection = document.querySelector(
    ".mobile-colors-filter"
  );
  const mobileSizesFilterSection = document.querySelector(
    ".mobile-sizes-filter"
  );
  const mobilePricesFilterSection = document.querySelector(
    ".mobile-prices-filter"
  );

  const handleDropdownToggleButtonClick = (index: number) => {
    const sections = [
      mobileColorsFilterSection,
      mobileSizesFilterSection,
      mobilePricesFilterSection,
    ];

    const section = sections[index];
    if (section) {
      section.classList.toggle("hidden");
      section.classList.toggle("active");
    }

    const isAnySectionActive = sections.some((section) =>
      section.classList.contains("active")
    );

    const mobileFilterButtonsWrapper = document.querySelector(
      ".mobile-filter-buttons-wrapper"
    );
    if (mobileFilterButtonsWrapper) {
      if (isAnySectionActive) {
        mobileFilterButtonsWrapper.classList.add("active");
      } else {
        mobileFilterButtonsWrapper.classList.remove("active");
      }
    }
  };
  dropdownToggleButton.forEach((button, index) => {
    button.addEventListener("click", () =>
      handleDropdownToggleButtonClick(index)
    );
  });
};

const handleMobileFiltering = () => {
  const applyFilterButton = document.querySelector(
    ".mobile-filter-apply-button"
  );
  const clearFilterButton = document.querySelector(
    ".mobile-filter-buttons-wrapper button:not(.mobile-filter-apply-button)"
  );
  const mainFilterSection = document.querySelector(".main-filter");

  const handleClearFilterButtonClick = () => {
    const mobileCheckboxes = document.querySelectorAll<HTMLInputElement>(
      ".mobile-filter-content input[type=checkbox]:checked"
    );

    mobileCheckboxes.forEach((checkbox) => {
      checkbox.checked = false;
    });
  };

  const handleApplyFilterButtonClick = async () => {
    const contentUl = document.querySelector(".content") as HTMLElement;

    removeNoProductsFoundMessage();
    currentPage = 1;

    const activeFilters = Array.from(
      document.querySelectorAll<HTMLInputElement>(
        ".mobile-filter-content input[type=checkbox]:checked"
      )
    ).map((checkbox) => checkbox.id);

    if (activeFilters.length === 0) {
      contentUl.innerHTML = "";
      await fetchProducts(currentPage);
    } else await fetchFilteredProducts(currentPage, activeFilters);

    adjustLoadMoreButtonVisibility();
    mainFilterSection.classList.add("mobile-filter-exit");
  };

  applyFilterButton.addEventListener("click", handleApplyFilterButtonClick);
  clearFilterButton.addEventListener("click", handleClearFilterButtonClick);
};
