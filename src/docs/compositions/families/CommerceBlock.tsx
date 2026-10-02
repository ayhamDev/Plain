import * as React from 'react';
import { ArrowRight, Check, ChevronRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Badge, Button, EmptyState } from '../../../ui/primitives';
import { Checkbox, Field, Input, ToggleGroup, ToggleGroupItem } from '../../../ui/forms';
import {
  BlockHeading,
  ChoiceSelect,
  ConfigField,
  downloadText,
  initialValues,
  money,
  SearchField,
  Status,
  validateFields,
} from '../helpers';
import type { CommerceConfig, FormField, ProductItem } from '../types';

const checkoutFields: FormField[] = [
  { name: 'name', label: 'Full name', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'address', label: 'Street address', type: 'text', required: true },
  { name: 'city', label: 'City', type: 'text', required: true },
  { name: 'postal', label: 'Postal code', type: 'text', required: true },
  {
    name: 'method',
    label: 'Payment method',
    type: 'select',
    required: true,
    initial: 'Invoice',
    options: [
      { value: 'Invoice', label: 'Invoice' },
      { value: 'Pay on collection', label: 'Pay on collection' },
    ],
  },
];
function ProductPhoto({ product }: { product: ProductItem }) {
  const [failed, setFailed] = React.useState(false);
  return product.image && !failed ? (
    <img
      className="pb-product-image"
      src={product.image}
      alt={product.name}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  ) : (
    <div className="pb-product-image pb-image-fallback">
      <ShoppingBag size={32} aria-hidden="true" />
      <span>{product.name}</span>
    </div>
  );
}
function Quantity({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
}) {
  return (
    <div className="pb-quantity">
      <Button
        size="icon"
        variant="ghost"
        aria-label={`Decrease ${label} quantity`}
        title="Decrease quantity"
        disabled={value <= 1}
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        <Minus aria-hidden="true" />
      </Button>
      <Input
        type="number"
        min={1}
        max={99}
        aria-label={`${label} quantity`}
        value={value}
        onChange={(event) => onChange(Math.min(99, Math.max(1, Number(event.target.value))))}
      />
      <Button
        size="icon"
        variant="ghost"
        aria-label={`Increase ${label} quantity`}
        title="Increase quantity"
        disabled={value >= 99}
        onClick={() => onChange(Math.min(99, value + 1))}
      >
        <Plus aria-hidden="true" />
      </Button>
    </div>
  );
}
export function CommerceBlock({ config }: { config: CommerceConfig }) {
  const [quantities, setQuantities] = React.useState<Record<string, number>>(() =>
    Object.fromEntries(config.products.map((product) => [product.id, 1])),
  );
  const [included, setIncluded] = React.useState<string[]>(() =>
    config.products.map((product) => product.id),
  );
  const [variants, setVariants] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(config.products.map((product) => [product.id, product.options?.[0] ?? ''])),
  );
  const [query, setQuery] = React.useState('');
  const [sort, setSort] = React.useState('featured');
  const [priceFilter, setPriceFilter] = React.useState('all');
  const [interval, setInterval] = React.useState('monthly');
  const [selectedPlan, setSelectedPlan] = React.useState('');
  const [cart, setCart] = React.useState<Record<string, number>>({});
  const [coupon, setCoupon] = React.useState('');
  const [discount, setDiscount] = React.useState(false);
  const [reason, setReason] = React.useState('Does not fit my needs');
  const [orderStage, setOrderStage] = React.useState(1);
  const [complete, setComplete] = React.useState(false);
  const [values, setValues] = React.useState(() => initialValues(checkoutFields));
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [feedback, setFeedback] = React.useState('');
  const active = config.products.filter((product) => included.includes(product.id));
  const subtotal = active.reduce(
    (sum, product) => sum + product.price * (quantities[product.id] ?? 1),
    0,
  );
  const reduction = config.variant === 'bundle' && active.length >= 2 ? 0.15 : discount ? 0.1 : 0;
  const shipping =
    subtotal >= 150 || subtotal === 0 || ['bundle', 'returns'].includes(config.variant) ? 0 : 8;
  const total = subtotal * (1 - reduction) + shipping;
  const visible = config.products
    .filter(
      (product) =>
        `${product.name} ${product.detail}`.toLowerCase().includes(query.toLowerCase()) &&
        (priceFilter === 'all' || product.price <= 150),
    )
    .sort((a, b) => (sort === 'low' ? a.price - b.price : sort === 'high' ? b.price - a.price : 0));
  const quantity = (product: ProductItem) => (
    <Quantity
      label={product.name}
      value={quantities[product.id]}
      onChange={(value) => setQuantities({ ...quantities, [product.id]: value })}
    />
  );
  const variantControl = (product: ProductItem) =>
    product.options && (
      <ChoiceSelect
        label={`${product.name} variant`}
        value={variants[product.id]}
        onChange={(value) => setVariants({ ...variants, [product.id]: value })}
        choices={product.options.map((label) => ({ value: label, label }))}
      />
    );
  const add = (product: ProductItem) => {
    setCart({ ...cart, [product.id]: (cart[product.id] ?? 0) + quantities[product.id] });
    setFeedback(`${product.name} added to bag`);
  };
  const summary = (
    <aside className="pb-order-summary">
      <h3>Summary</h3>
      <dl>
        <div>
          <dt>Subtotal</dt>
          <dd>{money(subtotal)}</dd>
        </div>
        {reduction > 0 && (
          <div>
            <dt>Discount ({reduction * 100}%)</dt>
            <dd>-{money(subtotal * reduction)}</dd>
          </div>
        )}
        <div>
          <dt>Delivery</dt>
          <dd>{shipping ? money(shipping) : 'Included'}</dd>
        </div>
        <div className="pb-order-total">
          <dt>Total</dt>
          <dd>{money(total)}</dd>
        </div>
      </dl>
    </aside>
  );
  return (
    <section data-block="commerce" data-variant={config.variant}>
      <BlockHeading
        title={config.title}
        subtitle={config.subtitle}
        actions={
          ['product', 'catalog', 'compare'].includes(config.variant) ? (
            <Badge variant="outline">
              <ShoppingBag size={13} aria-hidden="true" />
              {Object.values(cart).reduce((sum, count) => sum + count, 0)} in bag
            </Badge>
          ) : undefined
        }
      />
      {complete ? (
        <div className="pb-receipt">
          <Check size={30} aria-hidden="true" />
          <h3>{config.variant === 'returns' ? 'Return request created' : 'Order recorded'}</h3>
          <dl className="pb-details">
            <div>
              <dt>Reference</dt>
              <dd>{config.variant === 'returns' ? 'RET-1042' : 'OBJ-1042'}</dd>
            </div>
            <div>
              <dt>Items</dt>
              <dd>
                {active.map((product) => `${product.name} (${quantities[product.id]})`).join(', ')}
              </dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>{money(total)}</dd>
            </div>
            {config.variant === 'returns' && (
              <div>
                <dt>Reason</dt>
                <dd>{reason}</dd>
              </div>
            )}
          </dl>
          <div className="pb-actions">
            <Button
              variant="outline"
              onClick={() =>
                downloadText(
                  'order-receipt.json',
                  JSON.stringify(
                    {
                      reference: 'OBJ-1042',
                      items: active.map((product) => ({
                        name: product.name,
                        quantity: quantities[product.id],
                        variant: variants[product.id],
                        price: product.price,
                      })),
                      total,
                      ...(config.variant === 'returns' ? { reason } : {}),
                    },
                    null,
                    2,
                  ),
                  'application/json',
                )
              }
            >
              Download receipt
            </Button>
            <Button variant="ghost" onClick={() => setComplete(false)}>
              Back to order
            </Button>
          </div>
        </div>
      ) : config.variant === 'product' ? (
        <div className="pb-product-detail">
          <ProductPhoto product={config.products[0]} />
          <div>
            <Badge variant="outline">Object collection</Badge>
            <h3>{config.products[0].name}</h3>
            <strong className="pb-product-price">{money(config.products[0].price)}</strong>
            <p>{config.products[0].detail}</p>
            {variantControl(config.products[0])}
            {quantity(config.products[0])}
            <Button onClick={() => add(config.products[0])}>
              <ShoppingBag aria-hidden="true" />
              Add to bag
            </Button>
            <dl className="pb-details">
              <div>
                <dt>Delivery</dt>
                <dd>3-5 working days</dd>
              </div>
              <div>
                <dt>Returns</dt>
                <dd>30 days from delivery</dd>
              </div>
            </dl>
          </div>
        </div>
      ) : config.variant === 'catalog' ? (
        <>
          <div className="pb-toolbar">
            <SearchField value={query} onChange={setQuery} label="Search products" />
            <ChoiceSelect
              value={priceFilter}
              onChange={setPriceFilter}
              label="Price filter"
              choices={[
                { value: 'all', label: 'All prices' },
                { value: 'under', label: '$150 or less' },
              ]}
            />
            <ChoiceSelect
              value={sort}
              onChange={setSort}
              label="Sort products"
              choices={[
                { value: 'featured', label: 'Featured' },
                { value: 'low', label: 'Price: low to high' },
                { value: 'high', label: 'Price: high to low' },
              ]}
            />
          </div>
          <div className="pb-product-grid">
            {visible.map((product) => (
              <article key={product.id}>
                <ProductPhoto product={product} />
                <div className="pb-row">
                  <h3>{product.name}</h3>
                  <strong>{money(product.price)}</strong>
                </div>
                <p>{product.detail}</p>
                {variantControl(product)}
                <Button size="sm" variant="outline" onClick={() => add(product)}>
                  <Plus aria-hidden="true" />
                  Add to bag
                </Button>
              </article>
            ))}
          </div>
          {!visible.length && (
            <EmptyState
              title="No products found"
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery('');
                    setPriceFilter('all');
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          )}
        </>
      ) : config.variant === 'plans' ? (
        <>
          <ToggleGroup
            type="single"
            value={interval}
            onValueChange={(value) => value && setInterval(value)}
            aria-label="Billing interval"
          >
            <ToggleGroupItem value="monthly">Monthly</ToggleGroupItem>
            <ToggleGroupItem value="annual">Annual</ToggleGroupItem>
          </ToggleGroup>
          <div className="pb-plans">
            {config.products.map((product, index) => (
              <article key={product.id} data-selected={selectedPlan === product.id}>
                <header>
                  <h3>{product.name}</h3>
                  {index === 1 && <Badge variant="accent">Most chosen</Badge>}
                </header>
                <p>
                  <strong>{money(product.price * (interval === 'annual' ? 0.8 : 1))}</strong>
                  <span>/ seat / month</span>
                </p>
                <ul>
                  {product.detail.split(' · ').map((capability) => (
                    <li key={capability}>
                      <Check size={14} aria-hidden="true" />
                      {capability}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={
                    selectedPlan === product.id ? 'secondary' : index === 1 ? 'primary' : 'outline'
                  }
                  onClick={() => {
                    setSelectedPlan(product.id);
                    setFeedback(`${product.name} plan selected · ${interval} billing`);
                  }}
                >
                  <Check aria-hidden="true" />
                  {selectedPlan === product.id ? 'Selected' : 'Choose plan'}
                </Button>
              </article>
            ))}
          </div>
        </>
      ) : config.variant === 'checkout' ? (
        <div className="pb-checkout">
          <form
            className="pb-form"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              const next = validateFields(checkoutFields, values);
              setErrors(next);
              if (!Object.keys(next).length) setComplete(true);
            }}
          >
            <h3>Delivery details</h3>
            <div className="pb-checkout-fields">
              {checkoutFields.map((field) => (
                <ConfigField
                  key={field.name}
                  field={field}
                  value={values[field.name]}
                  error={errors[field.name]}
                  onChange={(value) => setValues({ ...values, [field.name]: value })}
                />
              ))}
            </div>
            <Button type="submit">
              <Check aria-hidden="true" />
              Place order
            </Button>
          </form>
          {summary}
        </div>
      ) : config.variant === 'order' ? (
        <>
          <ol className="pb-order-stages">
            {['Confirmed', 'Packed', 'Dispatched', 'Delivered'].map((stage, index) => (
              <li key={stage} data-complete={index <= orderStage}>
                <span>
                  {index <= orderStage ? <Check size={15} aria-hidden="true" /> : index + 1}
                </span>
                <strong>{stage}</strong>
              </li>
            ))}
          </ol>
          <div className="pb-list">
            {config.products.map((product) => (
              <div className="pb-list-row" key={product.id}>
                <ProductPhoto product={product} />
                <span>
                  <strong>{product.name}</strong>
                  <small>{product.detail}</small>
                </span>
                <strong>{money(product.price)}</strong>
              </div>
            ))}
          </div>
          <div className="pb-actions">
            <Button
              variant="outline"
              disabled={orderStage >= 3}
              onClick={() => setOrderStage(orderStage + 1)}
            >
              <ChevronRight aria-hidden="true" />
              Advance fulfillment
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                downloadText(
                  'order-OBJ-1042.json',
                  JSON.stringify(
                    {
                      products: config.products,
                      status: ['Confirmed', 'Packed', 'Dispatched', 'Delivered'][orderStage],
                      total: subtotal,
                    },
                    null,
                    2,
                  ),
                  'application/json',
                )
              }
            >
              Download receipt
            </Button>
          </div>
        </>
      ) : config.variant === 'compare' ? (
        <div className="pb-comparison-scroll">
          <table className="pb-comparison">
            <caption className="sr-only">Product comparison</caption>
            <thead>
              <tr>
                <th scope="col">Product</th>
                {config.products.map((product) => (
                  <th scope="col" key={product.id}>
                    <ProductPhoto product={product} />
                    <h3>{product.name}</h3>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Price</th>
                {config.products.map((product) => (
                  <td key={product.id}>{money(product.price)}</td>
                ))}
              </tr>
              <tr>
                <th scope="row">Details</th>
                {config.products.map((product) => (
                  <td key={product.id}>{product.detail}</td>
                ))}
              </tr>
              <tr>
                <th scope="row">Variant</th>
                {config.products.map((product) => (
                  <td key={product.id}>{variantControl(product)}</td>
                ))}
              </tr>
              <tr>
                <th scope="row">Bag</th>
                {config.products.map((product) => (
                  <td key={product.id}>
                    <Button variant="outline" size="sm" onClick={() => add(product)}>
                      <Plus aria-hidden="true" />
                      Add
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="pb-cart-layout">
          <div className="pb-cart-items">
            {config.products
              .filter(
                (product) =>
                  config.variant === 'bundle' ||
                  config.variant === 'returns' ||
                  included.includes(product.id),
              )
              .map((product) => (
                <div className="pb-cart-item" key={product.id}>
                  {['bundle', 'returns'].includes(config.variant) && (
                    <Checkbox
                      aria-label={`Include ${product.name}`}
                      checked={included.includes(product.id)}
                      onCheckedChange={(checked) =>
                        setIncluded(
                          checked
                            ? [...included, product.id]
                            : included.filter((id) => id !== product.id),
                        )
                      }
                    />
                  )}
                  <ProductPhoto product={product} />
                  <span>
                    <strong>{product.name}</strong>
                    <small>{product.detail}</small>
                    <b>{money(product.price)}</b>
                  </span>
                  {config.variant !== 'returns' && quantity(product)}
                  {config.variant === 'cart' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${product.name}`}
                      title="Remove item"
                      onClick={() => setIncluded(included.filter((id) => id !== product.id))}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  )}
                </div>
              ))}
            {!active.length && config.variant === 'cart' && (
              <EmptyState
                title="Your bag is empty"
                action={
                  <Button
                    variant="outline"
                    onClick={() => setIncluded(config.products.map((product) => product.id))}
                  >
                    Restore items
                  </Button>
                }
              />
            )}
            {config.variant === 'discount' && (
              <form
                className="pb-coupon"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (coupon.trim().toUpperCase() === 'AUTUMN10') {
                    setDiscount(true);
                    setFeedback('10% discount applied');
                  } else setFeedback('That promotion code is not valid.');
                }}
              >
                <Field label="Promotion code">
                  <Input
                    value={coupon}
                    onChange={(event) => setCoupon(event.target.value)}
                    placeholder="AUTUMN10"
                  />
                </Field>
                <Button type="submit" size="sm" variant="outline">
                  Apply
                </Button>
                {discount && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setDiscount(false);
                      setCoupon('');
                    }}
                  >
                    Remove
                  </Button>
                )}
              </form>
            )}
            {config.variant === 'returns' && (
              <Field label="Reason for return">
                <ChoiceSelect
                  label="Reason for return"
                  value={reason}
                  onChange={setReason}
                  choices={[
                    'Does not fit my needs',
                    'Arrived damaged',
                    'Incorrect item',
                    'Changed my mind',
                  ].map((label) => ({ value: label, label }))}
                />
              </Field>
            )}
          </div>
          <div>
            {summary}
            <Button disabled={!active.length} onClick={() => setComplete(true)}>
              <ArrowRight aria-hidden="true" />
              {config.variant === 'returns'
                ? 'Create return request'
                : config.variant === 'bundle'
                  ? 'Reserve bundle'
                  : 'Review order'}
            </Button>
          </div>
        </div>
      )}
      {Object.keys(cart).length > 0 && (
        <div className="pb-bag-status">
          <ShoppingBag size={17} aria-hidden="true" />
          <span>
            {Object.entries(cart)
              .map(
                ([id, count]) =>
                  `${config.products.find((product) => product.id === id)?.name} (${count})`,
              )
              .join(', ')}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCart({});
              setFeedback('Bag cleared');
            }}
          >
            Clear bag
          </Button>
        </div>
      )}
      <Status>{feedback}</Status>
    </section>
  );
}
