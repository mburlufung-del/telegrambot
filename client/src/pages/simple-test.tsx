export default function SimpleTest() {
  return (
    <div style={{ padding: '20px', backgroundColor: 'lightgreen' }}>
      <h1 style={{ color: 'darkgreen', fontSize: '24px' }}>✅ SUCCESS - ROUTING WORKS!</h1>
      <p>If you can see this green page, the routing system is working correctly.</p>
      <p>Current time: {new Date().toLocaleTimeString()}</p>
    </div>
  );
}