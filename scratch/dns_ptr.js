const dns = require('dns');

dns.reverse('2406:da1c:61c:d600:b946:12b6:8c91:aa98', (err, hostnames) => {
  if (err) {
    console.error("Reverse DNS lookup failed:", err.message);
  } else {
    console.log("Reverse DNS Hostnames:", hostnames);
  }
});
