const pad0 = (s) => {
  return String(s).padStart(2,0);
}

const updateDate = () => {
  const time = new Date(new Date().toLocaleString("en-US", {
    timeZone: "Asia/Shanghai"
  }));

  document.getElementById("time").innerText = `${time.getFullYear()}-${pad0(time.getMonth() + 1)}-${pad0(time.getDate())} ${pad0(time.getHours())}:${pad0(time.getMinutes())}`;
}

window.onload = function() {
  updateDate();
  setInterval(updateDate, 1000 * 60);
}
