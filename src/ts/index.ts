import { Product } from "./Product";

const serverUrl = "http://localhost:5000";

const contentSection = document.querySelector(".main-section") as HTMLElement;
const loadMoreButton = document.createElement("button");

let currentPage = 1;
let productsPerPage: number;
const fallbackMessageText = "Não existem mais produtos.";

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
    button.textContent = "comprar";

    li.appendChild(img);
    li.appendChild(h2);
    li.appendChild(priceSpan);
    li.appendChild(paymentSpan);
    li.appendChild(button);

    contentUl.appendChild(li);
  });
  currentPage++;
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
