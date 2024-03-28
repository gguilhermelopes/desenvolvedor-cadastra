import { Product } from "./Product";

const serverUrl = "http://localhost:5000";

const contentSection = document.querySelector(".main-section") as HTMLElement;
const cartCounter = document.querySelector(".cart-counter");
const headerContainer = document.querySelector(".header-container");
const loadMoreButton = document.createElement("button");
const fallbackMessageText = "Não existem mais produtos.";

let currentPage = 1;
let productsPerPage: number;
let products: Product[] | null;
let cartControlArray: Product[] | [] = [];

const updateProductsPerPageByWindowSize = () =>
  window.innerWidth < 870 ? (productsPerPage = 4) : (productsPerPage = 9);

async function main() {
  updateProductsPerPageByWindowSize();
  await fetchProducts(currentPage);
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
  cartControl();
  loadCartFromLocalStorage();
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

  const handleAddToCartClick = (button: Element) => {
    const productToAdd = products.filter(
      (product) => product.id === button.id
    )[0];
    cartControlArray = [...cartControlArray, productToAdd];

    updateCartCounter();

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

    saveCartToLocalStorage();
  };

  cartButtons.forEach((button) => {
    button.removeEventListener("click", () => handleAddToCartClick(button));
  });

  cartButtons.forEach((button) => {
    button.classList.remove("cart-add-button");
    button.addEventListener("click", () => handleAddToCartClick(button));
  });

  const saveCartToLocalStorage = () => {
    localStorage.setItem("cartItems", JSON.stringify(cartControlArray));
  };
};

const updateCartCounter = () => {
  if (cartControlArray.length !== 0) {
    cartCounter.classList.remove("hidden");
    cartCounter.textContent = cartControlArray.length.toString();
  }
};

const loadCartFromLocalStorage = () => {
  const savedCart = localStorage.getItem("cartItems");
  if (savedCart) {
    cartControlArray = JSON.parse(savedCart);
    updateCartCounter();
  }
};
