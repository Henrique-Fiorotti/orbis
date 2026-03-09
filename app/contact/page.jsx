"use client";

const whatsappContacts = [
  { label: "Whatsapp", number: "+55 11 9000-0000", link: "https://wa.me/5511900000000" },
  { label: "Whatsapp", number: "+55 11 9000-0000", link: "https://wa.me/5511900000000" },
  { label: "Whatsapp", number: "+55 11 9000-0000", link: "https://wa.me/5511900000000" },
];

export default function contact() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-20">

      {/* Icon */}
      <div className="mb-4 w-18 h-18">
        <img className="w-full h-full" src="/connect_icon_contact.svg" alt="" />
      </div>

      {/* Title */}
      <div className="px-8 py-2 mb-14">
        <h1 className="text-4xl font-semibold text-[#5e17eb] tracking-tight">
          Entre em contato
        </h1>
      </div>

      {/* Cards */}
      <div className="flex flex-wrap justify-center gap-6 mb-14">
        {whatsappContacts.map((contact, i) => (
          <a
            key={i}
            href={contact.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-3 w-52 px-8 py-10 border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-[#5e17eb] hover:-translate-y-1 transition-all duration-200"
          >
            {/* WhatsApp SVG icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="24" fill="#1a1a1a" />
              <path
                d="M33.5 14.5C31.3 12.2 28.3 11 25.1 11C18.4 11 13 16.4 13 23.1C13 25.3 13.6 27.5 14.7 29.4L12.9 36L19.7 34.2C21.5 35.2 23.3 35.8 25.1 35.8C31.8 35.8 37.2 30.4 37.2 23.7C37.1 20.4 35.9 17.4 33.5 14.5ZM25.1 33.7C23.5 33.7 21.8 33.2 20.4 32.3L20 32.1L16.2 33.1L17.2 29.4L16.9 29C15.9 27.4 15.3 25.5 15.3 23.4C15.3 17.7 19.9 13.1 25.6 13.1C28.3 13.1 30.8 14.2 32.7 16.1C34.6 18 35.7 20.5 35.7 23.2C35.5 28.9 30.8 33.7 25.1 33.7ZM30.6 25.9C30.3 25.7 28.8 25 28.5 24.9C28.2 24.8 28 24.7 27.8 25C27.6 25.3 27 26 26.8 26.2C26.6 26.4 26.4 26.5 26.1 26.3C25.2 25.8 24.3 25.3 23.5 24.5C22.9 23.9 22.3 23.1 21.8 22.3C21.6 22 21.7 21.8 21.9 21.6C22.1 21.4 22.3 21.1 22.4 20.9C22.5 20.7 22.6 20.5 22.5 20.3C22.4 20.1 21.8 18.6 21.6 18.1C21.4 17.7 21.1 17.7 20.9 17.7H20.3C20.1 17.7 19.8 17.8 19.5 18.1C19.2 18.4 18.5 19.1 18.5 20.6C18.5 22.1 19.6 23.5 19.7 23.7C19.8 23.9 21.7 26.7 24.3 28C24.9 28.3 25.5 28.5 26 28.7C26.6 28.9 27.3 28.9 27.7 28.8C28.2 28.7 29.5 28 29.8 27.3C30.1 26.6 30.1 26 30 25.9C29.9 25.8 30.6 25.9 30.6 25.9Z"
                fill="white"
              />
            </svg>

            <p className="text-sm font-medium text-gray-800">{contact.label}</p>
            <p className="text-sm font-medium text-[#5e17eb]">{contact.number}</p>
          </a>
        ))}
      </div>

      {/* SAC */}
      <div className="flex flex-col items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.08 6.08l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
        <p className="text-xs text-gray-400 text-center leading-relaxed">
          Em caso de dúvidas entre em <br /> contato com nosso SAC
        </p>
      </div>

    </div>
  );
}