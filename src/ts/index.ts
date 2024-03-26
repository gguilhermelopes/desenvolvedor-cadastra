import { Product } from "./Product";

const serverUrl = "http://localhost:5000";
const contentSection = document.querySelector(".main-section") as HTMLElement;
const loadMoreButton = document.createElement("button");
let currentPage = 1;
const productsPerPage = 9;
const fallbackMessageText = "Não existem mais produtos.";

async function main() {
  await fetchProducts(currentPage);
}

document.addEventListener("DOMContentLoaded", main);

const fetchProducts = async (page: number) => {
  const contentUl = document.querySelector(".content") as HTMLElement;

  const response = await fetch(`${serverUrl}/products`);
  const data = (await response.json()) as Product[];

  const startIndex = (page - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const productsToShow = data.slice(startIndex, endIndex);

  if (productsToShow.length === 0) {
    showNoMoreProductsMessage(contentUl);
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

const formatPaymentPlan = (data: number[]): string => {
  return `até ${data[0]}x de ${data[1].toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })}`;
};

const loadMoreProducts = () => {
  fetchProducts(currentPage);
};

loadMoreButton.textContent = "Carregar Mais";
loadMoreButton.classList.add("load-more-button");
loadMoreButton.addEventListener("click", loadMoreProducts);
contentSection.appendChild(loadMoreButton);

const showNoMoreProductsMessage = (contentUl: HTMLElement) => {
  const message = document.createElement("p");
  message.textContent = fallbackMessageText;
  message.classList.add("fallback-message");
  contentSection.appendChild(message);
  contentSection.removeChild(loadMoreButton);
};
