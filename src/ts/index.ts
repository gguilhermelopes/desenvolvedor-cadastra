import { Product } from "./Product";

const serverUrl = "http://localhost:5000";

const contentSection = document.querySelector(".main-section") as HTMLElement;
const cartCounter = document.querySelector(".cart-counter");
const headerContainer = document.querySelector(".header-container");
const cartItemsContainer = document.querySelector(".cart-items");

const loadMoreButton = document.createElement("button");
const fallbackMessageText = "Não existem mais produtos.";

let currentPage = 1;
let productsPerPage: number;
let products: Product[] | null;
let cartItemIdCounter = 0;
let cartControlArray: Product[] | null;

const updateProductsPerPageByWindowSize = () =>
  window.innerWidth < 870 ? (productsPerPage = 4) : (productsPerPage = 9);

async function main() {
  updateProductsPerPageByWindowSize();
  await fetchProducts(currentPage);
  handleOrderFilter();
  handleColorExpand();
}

window.addEventListener("resize", updateProductsPerPageByWindowSize);
document.addEventListener("DOMContentLoaded", main);

const fetchProducts = async (page: number) => {
  const contentUl = document.querySelector(".content") as HTMLElement;

  const response = await fetch(`${serverUrl}/products`);
  const data = (await response.json()) as Product[];
  products = data;

  const startIndex = (page - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const productsToShow = data.slice(startIndex, endIndex);

  if (productsToShow.length === 0) {
    showNoMoreProductsMessage();
    return;
  }

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
  cartControl();
};

const loadMoreProducts = () => {
  fetchProducts(currentPage);
};

loadMoreButton.textContent = "Carregar Mais";
loadMoreButton.classList.add("load-more-button");
loadMoreButton.addEventListener("click", loadMoreProducts);
contentSection.appendChild(loadMoreButton);

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

const cartControl = () => {
  const cartButtons = document.querySelectorAll(".cart-add-button");
  const cartToggleStateButton = document.querySelector(".cart-link");

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
    event.animationName === "cart-exit" &&
      cartItemsContainer.classList.remove("active");
  };

  cartToggleStateButton.addEventListener("click", handleCartToggleStateClick);
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

const handleOrderFilter = () => {
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
