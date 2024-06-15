import Image from 'next/image';
const Header = () => {
  return (
    <header className=" fixed top-0 left-0 right-0 p-4 z-10 flex flex-col items-center py-2 bg-white">
            <Image
              src="/logo.png"
              alt="Company Logo"
              width={300}
              height={50}
            />
            <h1>
              FactuPro - Gestiona tu factura
            </h1>
          </header>
  );
};

export default Header;